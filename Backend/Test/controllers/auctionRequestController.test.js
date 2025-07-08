jest.mock('../../src/models/auctionRequest', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn()
}));
jest.mock('../../src/models/artist', () => ({
  findOne: jest.fn(),
  findByPk: jest.fn()
}));
jest.mock('../../src/models/product', () => ({
  findByPk: jest.fn()
}));
jest.mock('../../src/models/admin', () => ({
  findOne: jest.fn()
}));
jest.mock('../../src/models/user', () => ({
  findByPk: jest.fn()
}));
jest.mock('../../src/models/category', () => ({}));
jest.mock('../../src/models/Product_Order', () => ({}));
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));
jest.mock('../../src/config/firebase', () => ({
  firebase_db: {
    ref: jest.fn()
  }
}));
jest.mock('../../src/utils/emailService', () => ({
  sendAuctionApprovedEmail: jest.fn(),
  sendAuctionRejectedEmail: jest.fn()
}));
jest.mock('../../src/utils/dateValidation', () => ({
  convertToDateTime: jest.fn(),
  formatToLocaleString: jest.fn()
}));
jest.mock('sequelize', () => {
  const actualSequelize = jest.requireActual('sequelize');
  return {
    ...actualSequelize,
    Sequelize: {
      literal: jest.fn()
    }
  };
});

const auctionRequestController = require('../../src/controllers/auctionRequestController');
const AuctionRequest = require('../../src/models/auctionRequest');
const Artist = require('../../src/models/artist');
const Product = require('../../src/models/product');
const Admin = require('../../src/models/admin');
const User = require('../../src/models/user');
const { validationResult } = require('express-validator');
const { firebase_db } = require('../../src/config/firebase');
const { sendAuctionApprovedEmail, sendAuctionRejectedEmail } = require('../../src/utils/emailService');
const { convertToDateTime, formatToLocaleString } = require('../../src/utils/dateValidation');

describe('Auction Request Controller', () => {
  let req, res, mockFirebaseRef, mockAuctionRef;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      params: {},
      body: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockAuctionRef = {
      push: jest.fn(),
      set: jest.fn()
    };

    mockFirebaseRef = {
      once: jest.fn(),
      ref: jest.fn().mockReturnValue({
        once: jest.fn()
      })
    };

    jest.clearAllMocks();
    
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    firebase_db.ref.mockReturnValue(mockFirebaseRef);
    convertToDateTime.mockImplementation((date) => new Date(date));
    formatToLocaleString.mockImplementation((date) => date.toISOString());
  });

  describe('createAuctionRequest', () => {
    beforeEach(() => {
      req.body = {
        productId: 1,
        startingPrice: 100,
        Duration: 24,
        notes: 'Test auction request'
      };
    });

    it('should return validation errors when present', async () => {
      const errors = [{ msg: 'Invalid data' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

      await auctionRequestController.createAuctionRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors });
    });

    it('should return 403 when user is not an artist', async () => {
      Artist.findOne.mockResolvedValue(null);

      await auctionRequestController.createAuctionRequest(req, res);

      expect(Artist.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Only artists can request auctions' });
    });

    it('should return 404 when product not found', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      Artist.findOne.mockResolvedValue(mockArtist);
      Product.findByPk.mockResolvedValue(null);

      await auctionRequestController.createAuctionRequest(req, res);

      expect(Product.findByPk).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
    });

    it('should return 400 when product is not of type auction', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockProduct = { productId: 1, type: 'regular', artistId: 1 };
      
      Artist.findOne.mockResolvedValue(mockArtist);
      Product.findByPk.mockResolvedValue(mockProduct);

      await auctionRequestController.createAuctionRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Product must be of type auction' });
    });

    it('should return 403 when artist tries to request auction for another artists product', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockProduct = { productId: 1, type: 'auction', artistId: 2 };
      
      Artist.findOne.mockResolvedValue(mockArtist);
      Product.findByPk.mockResolvedValue(mockProduct);

      await auctionRequestController.createAuctionRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'You can only request auctions for your own products' });
    });

    it('should create auction request successfully', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockProduct = { productId: 1, type: 'auction', artistId: 1 };
      const mockAuctionRequest = { requestId: 1, artistId: 1, productId: 1 };

      Artist.findOne.mockResolvedValue(mockArtist);
      Product.findByPk.mockResolvedValue(mockProduct);
      AuctionRequest.create.mockResolvedValue(mockAuctionRequest);

      await auctionRequestController.createAuctionRequest(req, res);

      expect(AuctionRequest.create).toHaveBeenCalledWith({
        artistId: 1,
        productId: 1,
        startingPrice: 100,
        suggestedDuration: 24,
        notes: 'Test auction request',
        status: 'pending'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Auction request created successfully',
        requestId: 1,
        productId: 1,
        artistId: 1
      });
    });

    it('should handle internal server error', async () => {
      Artist.findOne.mockRejectedValue(new Error('Database error'));

      await auctionRequestController.createAuctionRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getMyAuctionRequests', () => {
    it('should return 403 when user is not an artist', async () => {
      Artist.findOne.mockResolvedValue(null);

      await auctionRequestController.getMyAuctionRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Only artists can view their auction requests' });
    });

    it('should return artist auction requests successfully', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequests = [
        {
          requestId: 1,
          status: 'pending',
          auctionId: null,
          toJSON: () => ({
            requestId: 1,
            status: 'pending',
            auctionId: null,
            Product: {
              productId: 1,
              name: 'Test Product',
              image: 'test.jpg',
              Category: { name: 'Paintings' }
            }
          })
        },
        {
          requestId: 2,
          status: 'scheduled',
          auctionId: 'auction123',
          toJSON: () => ({
            requestId: 2,
            status: 'scheduled',
            auctionId: 'auction123',
            Product: {
              productId: 2,
              name: 'Test Product 2',
              image: 'test2.jpg',
              Category: { name: 'Sculptures' }
            }
          })
        }
      ];

      Artist.findOne.mockResolvedValue(mockArtist);
      AuctionRequest.findAll.mockResolvedValue(mockRequests);
      const mockAuctionSnapshot = {
        exists: () => true,
        val: () => ({
          startDate: '2025-01-01',
          endDate: '2025-01-02',
          status: 'scheduled'
        })
      };
      firebase_db.ref.mockReturnValue({
        once: jest.fn().mockResolvedValue(mockAuctionSnapshot)
      });

      await auctionRequestController.getMyAuctionRequests(req, res);

      expect(AuctionRequest.findAll).toHaveBeenCalledWith({
        where: { artistId: 1 },
        include: expect.any(Array),
        order: [['createdAt', 'DESC']]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          requestId: 1,
          status: 'pending',
          auction: null
        }),
        expect.objectContaining({
          requestId: 2,
          status: 'scheduled',
          auction: expect.objectContaining({
            status: 'scheduled'
          })
        })
      ]));
    });

    it('should handle firebase error gracefully', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequests = [
        {
          requestId: 1,
          status: 'scheduled',
          auctionId: 'auction123',
          toJSON: () => ({
            requestId: 1,
            status: 'scheduled',
            auctionId: 'auction123'
          })
        }
      ];

      Artist.findOne.mockResolvedValue(mockArtist);
      AuctionRequest.findAll.mockResolvedValue(mockRequests);
      firebase_db.ref.mockReturnValue({
        once: jest.fn().mockRejectedValue(new Error('Firebase error'))
      });

      await auctionRequestController.getMyAuctionRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          requestId: 1,
          auction: null
        })
      ]));
    });

    it('should handle internal server error', async () => {
      Artist.findOne.mockRejectedValue(new Error('Database error'));

      await auctionRequestController.getMyAuctionRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getAllAuctionRequests', () => {
    it('should return 403 when user is not an admin', async () => {
      Admin.findOne.mockResolvedValue(null);

      await auctionRequestController.getAllAuctionRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Only admins can view all auction requests' });
    });

    it('should return all auction requests for admin', async () => {
      const mockAdmin = { adminId: 1, userId: 1 };
      const mockRequests = [
        {
          requestId: 1,
          status: 'pending',
          Product: {
            productId: 1,
            name: 'Test Product',
            totalSales: 5
          },
          Artist: {
            artistId: 1,
            name: 'Test Artist',
            username: 'testartist'
          }
        }
      ];

      Admin.findOne.mockResolvedValue(mockAdmin);
      AuctionRequest.findAll.mockResolvedValue(mockRequests);

      await auctionRequestController.getAllAuctionRequests(req, res);

      expect(AuctionRequest.findAll).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Array),
        order: [['createdAt', 'DESC']]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    it('should filter auction requests by status', async () => {
      req.query.status = 'pending';
      const mockAdmin = { adminId: 1, userId: 1 };

      Admin.findOne.mockResolvedValue(mockAdmin);
      AuctionRequest.findAll.mockResolvedValue([]);

      await auctionRequestController.getAllAuctionRequests(req, res);

      expect(AuctionRequest.findAll).toHaveBeenCalledWith({
        where: { status: 'pending' },
        include: expect.any(Array),
        order: [['createdAt', 'DESC']]
      });
    });

    it('should handle internal server error', async () => {
      Admin.findOne.mockRejectedValue(new Error('Database error'));

      await auctionRequestController.getAllAuctionRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('approveAndScheduleAuction', () => {
    beforeEach(() => {
      req.params = { requestId: '1' };
      req.body = {
        startDate: '2025-12-01T10:00:00Z',
        Duration: 48,
        adminNotes: 'Approved for testing'
      };
      const mockNewAuctionRef = {
        key: 'auction123',
        set: jest.fn().mockResolvedValue()
      };
      mockFirebaseRef.push = jest.fn().mockReturnValue(mockNewAuctionRef);
      firebase_db.ref.mockReturnValue(mockFirebaseRef);
    });

    it('should return validation errors when present', async () => {
      const errors = [{ msg: 'Invalid data' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

      await auctionRequestController.approveAndScheduleAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors });
    });

    it('should return 403 when user is not an admin', async () => {
      Admin.findOne.mockResolvedValue(null);

      await auctionRequestController.approveAndScheduleAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Only admins can approve auction requests' });
    });

    it('should return 400 when request ID is missing', async () => {
      req.params = {};
      const mockAdmin = { adminId: 1, userId: 1 };
      Admin.findOne.mockResolvedValue(mockAdmin);

      await auctionRequestController.approveAndScheduleAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Request ID is required' });
    });

    it('should return 404 when auction request not found', async () => {
      const mockAdmin = { adminId: 1, userId: 1 };
      Admin.findOne.mockResolvedValue(mockAdmin);
      AuctionRequest.findByPk.mockResolvedValue(null);

      await auctionRequestController.approveAndScheduleAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Auction request not found' });
    });

    it('should return 400 when request is not pending', async () => {
      const mockAdmin = { adminId: 1, userId: 1 };
      const mockRequest = { requestId: 1, status: 'approved' };
      
      Admin.findOne.mockResolvedValue(mockAdmin);
      AuctionRequest.findByPk.mockResolvedValue(mockRequest);

      await auctionRequestController.approveAndScheduleAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Request is already approved' });
    });

    it('should return 404 when product not found', async () => {
      const mockAdmin = { adminId: 1, userId: 1 };
      const mockRequest = { 
        requestId: 1, 
        status: 'pending', 
        productId: 1,
        Product: null 
      };
      
      Admin.findOne.mockResolvedValue(mockAdmin);
      AuctionRequest.findByPk.mockResolvedValue(mockRequest);
      Product.findByPk.mockResolvedValue(null);

      await auctionRequestController.approveAndScheduleAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Product with ID 1 not found. The product may have been deleted.' 
      });
    });

    it('should return 400 for invalid date', async () => {
      const mockAdmin = { adminId: 1, userId: 1 };
      const mockRequest = { 
        requestId: 1, 
        status: 'pending',
        Product: { productId: 1, name: 'Test Product' }
      };
      
      Admin.findOne.mockResolvedValue(mockAdmin);
      AuctionRequest.findByPk.mockResolvedValue(mockRequest);
      convertToDateTime.mockImplementation(() => {
        throw new Error('Invalid date format');
      });

      await auctionRequestController.approveAndScheduleAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid date format' });
    });

    it('should return 400 for past date', async () => {
      const mockAdmin = { adminId: 1, userId: 1 };
      const mockRequest = { 
        requestId: 1, 
        status: 'pending',
        Product: { productId: 1, name: 'Test Product' }
      };
      
      Admin.findOne.mockResolvedValue(mockAdmin);
      AuctionRequest.findByPk.mockResolvedValue(mockRequest);
      
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
      convertToDateTime.mockReturnValue(pastDate);

      await auctionRequestController.approveAndScheduleAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Please choose a current or future date.' 
      });
    });

    it('should approve and schedule auction successfully', async () => {
      const mockAdmin = { adminId: 1, userId: 1 };
      const mockRequest = { 
        requestId: 1, 
        status: 'pending',
        productId: 1,
        artistId: 1,
        startingPrice: 100,
        suggestedDuration: 24,
        Product: { 
          productId: 1, 
          name: 'Test Product',
          description: 'Test Description',
          image: 'test.jpg'
        },
        update: jest.fn().mockResolvedValue()
      };
      const mockArtist = { artistId: 1, userId: 2, name: 'Test Artist' };
      const mockUser = { userId: 2, email: 'artist@test.com' };
      
      Admin.findOne.mockResolvedValue(mockAdmin);
      AuctionRequest.findByPk.mockResolvedValue(mockRequest);
      Artist.findByPk.mockResolvedValue(mockArtist);
      User.findByPk.mockResolvedValue(mockUser);
      
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      convertToDateTime.mockReturnValue(futureDate);
      formatToLocaleString.mockReturnValue(futureDate.toISOString());
      
      sendAuctionApprovedEmail.mockResolvedValue();

      await auctionRequestController.approveAndScheduleAuction(req, res);

      expect(mockFirebaseRef.push).toHaveBeenCalled();
      expect(mockRequest.update).toHaveBeenCalledWith({
        status: 'scheduled',
        scheduledStartDate: futureDate,
        scheduledEndDate: expect.any(Date),
        auctionId: 'auction123',
        adminNotes: 'Approved for testing'
      });
      expect(sendAuctionApprovedEmail).toHaveBeenCalledWith(
        'artist@test.com',
        'Test Artist',
        expect.objectContaining({
          productName: 'Test Product',
          auctionId: 'auction123'
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Auction request approved and auction scheduled successfully',
        auctionId: 'auction123'
      }));
    });

    it('should handle email sending error gracefully', async () => {
      const mockAdmin = { adminId: 1, userId: 1 };
      const mockRequest = { 
        requestId: 1, 
        status: 'pending',
        productId: 1,
        artistId: 1,
        startingPrice: 100,
        Product: { 
          productId: 1, 
          name: 'Test Product',
          description: 'Test Description',
          image: 'test.jpg'
        },
        update: jest.fn().mockResolvedValue()
      };
      
      Admin.findOne.mockResolvedValue(mockAdmin);
      AuctionRequest.findByPk.mockResolvedValue(mockRequest);
      Artist.findByPk.mockResolvedValue({ artistId: 1, userId: 2 });
      User.findByPk.mockResolvedValue({ userId: 2, email: 'artist@test.com' });
      
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      convertToDateTime.mockReturnValue(futureDate);
      formatToLocaleString.mockReturnValue(futureDate.toISOString());
      
      sendAuctionApprovedEmail.mockRejectedValue(new Error('Email service error'));

      await auctionRequestController.approveAndScheduleAuction(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle internal server error', async () => {
      Admin.findOne.mockRejectedValue(new Error('Database error'));

      await auctionRequestController.approveAndScheduleAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('rejectAuctionRequest', () => {
    beforeEach(() => {
      req.params = { requestId: '1' };
      req.body = { adminNotes: 'Not suitable for auction' };
    });

    it('should return validation errors when present', async () => {
      const errors = [{ msg: 'Invalid data' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

      await auctionRequestController.rejectAuctionRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors });
    });

    it('should return 400 when request ID is missing', async () => {
      req.params = {};

      await auctionRequestController.rejectAuctionRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Request ID is required' });
    });

    it('should return 404 when auction request not found', async () => {
      AuctionRequest.findByPk.mockResolvedValue(null);

      await auctionRequestController.rejectAuctionRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Auction request not found' });
    });

    it('should return 400 when request is not pending', async () => {
      const mockRequest = { requestId: 1, status: 'approved' };
      AuctionRequest.findByPk.mockResolvedValue(mockRequest);

      await auctionRequestController.rejectAuctionRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Request is already approved' });
    });

    it('should reject auction request successfully', async () => {
      const mockRequest = { 
        requestId: 1, 
        status: 'pending',
        artistId: 1,
        productId: 1,
        update: jest.fn().mockResolvedValue()
      };
      const mockArtist = { artistId: 1, userId: 2, name: 'Test Artist' };
      const mockProduct = { productId: 1, name: 'Test Product' };
      const mockUser = { userId: 2, email: 'artist@test.com' };

      AuctionRequest.findByPk.mockResolvedValue(mockRequest);
      Artist.findByPk.mockResolvedValue(mockArtist);
      Product.findByPk.mockResolvedValue(mockProduct);
      User.findByPk.mockResolvedValue(mockUser);
      sendAuctionRejectedEmail.mockResolvedValue();

      await auctionRequestController.rejectAuctionRequest(req, res);

      expect(mockRequest.update).toHaveBeenCalledWith({
        status: 'rejected',
        adminNotes: 'Not suitable for auction'
      });
      expect(sendAuctionRejectedEmail).toHaveBeenCalledWith(
        'artist@test.com',
        'Test Artist',
        {
          productName: 'Test Product',
          reason: 'Not suitable for auction'
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Auction request rejected successfully',
        requestId: 1
      });
    });

    it('should handle rejection without admin notes', async () => {
      req.body = {};
      const mockRequest = { 
        requestId: 1, 
        status: 'pending',
        artistId: 1,
        productId: 1,
        update: jest.fn().mockResolvedValue()
      };
      const mockArtist = { artistId: 1, userId: 2, name: 'Test Artist' };
      const mockProduct = { productId: 1, name: 'Test Product' };
      const mockUser = { userId: 2, email: 'artist@test.com' };

      AuctionRequest.findByPk.mockResolvedValue(mockRequest);
      Artist.findByPk.mockResolvedValue(mockArtist);
      Product.findByPk.mockResolvedValue(mockProduct);
      User.findByPk.mockResolvedValue(mockUser);
      sendAuctionRejectedEmail.mockResolvedValue();

      await auctionRequestController.rejectAuctionRequest(req, res);

      expect(mockRequest.update).toHaveBeenCalledWith({
        status: 'rejected',
        adminNotes: null
      });
      expect(sendAuctionRejectedEmail).toHaveBeenCalledWith(
        'artist@test.com',
        'Test Artist',
        {
          productName: 'Test Product',
          reason: 'No specific reason provided'
        }
      );
    });

    it('should handle email sending error gracefully', async () => {
      const mockRequest = { 
        requestId: 1, 
        status: 'pending',
        artistId: 1,
        productId: 1,
        update: jest.fn().mockResolvedValue()
      };

      AuctionRequest.findByPk.mockResolvedValue(mockRequest);
      Artist.findByPk.mockResolvedValue({ artistId: 1, userId: 2 });
      Product.findByPk.mockResolvedValue({ productId: 1, name: 'Test Product' });
      User.findByPk.mockResolvedValue({ userId: 2, email: 'artist@test.com' });
      sendAuctionRejectedEmail.mockRejectedValue(new Error('Email service error'));

      await auctionRequestController.rejectAuctionRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle internal server error', async () => {
      AuctionRequest.findByPk.mockRejectedValue(new Error('Database error'));

      await auctionRequestController.rejectAuctionRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});
