jest.mock('../../src/models/admin', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn()
}));
jest.mock('../../src/models/user', () => ({
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn()
}));
jest.mock('../../src/models/artist', () => ({
  findByPk: jest.fn(),
  count: jest.fn(),
  destroy: jest.fn()
}));
jest.mock('../../src/models/customer', () => ({
  count: jest.fn()
}));
jest.mock('../../src/models/product', () => ({
  findAll: jest.fn(),
  count: jest.fn(),
  destroy: jest.fn()
}));
jest.mock('../../src/models/auctionRequest', () => ({
  findAll: jest.fn(),
  count: jest.fn(),
  destroy: jest.fn()
}));
jest.mock('../../src/models/report', () => ({
  destroy: jest.fn()
}));
jest.mock('../../src/models/artistFollow', () => ({
  destroy: jest.fn()
}));
jest.mock('../../src/models/customizationResponse', () => ({
  findAll: jest.fn(),
  destroy: jest.fn()
}));
jest.mock('../../src/config/firebase', () => ({
  firebase_db: {
    ref: jest.fn()
  }
}));
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));
jest.mock('../../src/config/db', () => ({
  transaction: jest.fn()
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn()
}));
jest.mock('../../src/config/cloudinary', () => ({
  uploader: {
    destroy: jest.fn()
  }
}));

const adminController = require('../../src/controllers/adminController');
const Admin = require('../../src/models/admin');
const User = require('../../src/models/user');
const Artist = require('../../src/models/artist');
const Customer = require('../../src/models/customer');
const Product = require('../../src/models/product');
const AuctionRequest = require('../../src/models/auctionRequest');
const Report = require('../../src/models/report');
const ArtistFollow = require('../../src/models/artistFollow');
const CustomizationResponse = require('../../src/models/customizationResponse');
const { firebase_db } = require('../../src/config/firebase');
const { validationResult } = require('express-validator');
const sequelize = require('../../src/config/db');
const bcrypt = require('bcrypt');

describe('Admin Controller', () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };
    jest.clearAllMocks();

    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe('getProfile', () => {
    it('should return admin profile successfully', async () => {
      const mockAdmin = { adminId: 1, name: 'Admin User', username: 'admin1' };
      Admin.findOne.mockResolvedValue(mockAdmin);

      await adminController.getProfile(req, res);

      expect(Admin.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ admin: mockAdmin });
    });

    it('should return 404 when admin profile not found', async () => {
      Admin.findOne.mockResolvedValue(null);

      await adminController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Admin profile not found" });
    });

    it('should handle internal server error', async () => {
      Admin.findOne.mockRejectedValue(new Error('Database error'));

      await adminController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      req.body = {
        name: 'Updated Admin',
        username: 'updatedadmin',
        phone: '1234567890'
      };
    });

    it('should return validation errors when present', async () => {
      const errors = [{ msg: 'Invalid data' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

      await adminController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors });
    });

    it('should return 403 when user is not admin', async () => {
      const mockUser = { userId: 1, role: 'customer' };
      User.findOne.mockResolvedValue(mockUser);

      await adminController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    });

    it('should return 400 when required fields are missing', async () => {
      req.body = { name: 'Admin' };
      const mockUser = { userId: 1, role: 'admin' };
      User.findOne.mockResolvedValue(mockUser);

      await adminController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Please fill all required fields",
        required: ['name', 'username', 'phone']
      });
    });

    it('should update existing admin profile successfully', async () => {
      const mockUser = { userId: 1, role: 'admin' };
      const mockAdmin = { 
        userId: 1, 
        username: 'oldusername',
        update: jest.fn().mockResolvedValue(true)
      };
      
      User.findOne.mockResolvedValue(mockUser);
      Admin.findOne.mockResolvedValueOnce(mockAdmin).mockResolvedValueOnce(null);

      await adminController.updateProfile(req, res);

      expect(mockAdmin.update).toHaveBeenCalledWith({
        name: 'Updated Admin',
        username: 'updatedadmin',
        phone: '1234567890'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ admin: mockAdmin });
    });

    it('should return 400 when username already exists for different admin', async () => {
      const mockUser = { userId: 1, role: 'admin' };
      const mockAdmin = { userId: 1, username: 'oldusername' };
      const mockExistingAdmin = { userId: 2, username: 'updatedadmin' };
      
      User.findOne.mockResolvedValue(mockUser);
      Admin.findOne
        .mockResolvedValueOnce(mockAdmin)
        .mockResolvedValueOnce(mockExistingAdmin);

      await adminController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Username already exists" });
    });

    it('should create new admin profile when none exists', async () => {
      const mockUser = { userId: 1, role: 'admin' };
      const mockNewAdmin = { adminId: 1, name: 'Updated Admin', username: 'updatedadmin' };
      
      User.findOne.mockResolvedValue(mockUser);
      Admin.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      Admin.create.mockResolvedValue(mockNewAdmin);

      await adminController.updateProfile(req, res);

      expect(Admin.create).toHaveBeenCalledWith({
        name: 'Updated Admin',
        username: 'updatedadmin',
        phone: '1234567890',
        userId: 1
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ admin: mockNewAdmin });
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics successfully', async () => {
      const mockUser = { userId: 1, role: 'admin' };
      const mockFirebaseSnapshot = {
        val: () => ({ auction1: {}, auction2: {} })
      };
      const mockAuctionsRef = {
        once: jest.fn().mockResolvedValue(mockFirebaseSnapshot)
      };

      User.findOne.mockResolvedValue(mockUser);
      Artist.count.mockResolvedValue(10);
      Customer.count.mockResolvedValue(50);
      Product.count.mockResolvedValue(100);
      AuctionRequest.count.mockResolvedValue(5);
      firebase_db.ref.mockReturnValue(mockAuctionsRef);

      await adminController.getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Dashboard statistics retrieved successfully",
        stats: {
          totalUsers: 60,
          totalArtists: 10,
          totalCustomers: 50,
          totalProducts: 100,
          totalAuctions: 2,
          pendingAuctionRequests: 5
        }
      });
    });

    it('should return 403 when user is not admin', async () => {
      const mockUser = { userId: 1, role: 'customer' };
      User.findOne.mockResolvedValue(mockUser);

      await adminController.getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Forbidden: Admin access required" });
    });

    it('should handle firebase error gracefully', async () => {
      const mockUser = { userId: 1, role: 'admin' };
      const mockAuctionsRef = {
        once: jest.fn().mockRejectedValue(new Error('Firebase error'))
      };

      User.findOne.mockResolvedValue(mockUser);
      Artist.count.mockResolvedValue(10);
      Customer.count.mockResolvedValue(50);
      Product.count.mockResolvedValue(100);
      AuctionRequest.count.mockResolvedValue(5);
      firebase_db.ref.mockReturnValue(mockAuctionsRef);

      await adminController.getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Dashboard statistics retrieved successfully",
        stats: {
          totalUsers: 60,
          totalArtists: 10,
          totalCustomers: 50,
          totalProducts: 100,
          totalAuctions: 0,
          pendingAuctionRequests: 5
        }
      });
    });
  });

  describe('removeArtist', () => {
    beforeEach(() => {
      req.params = { artistId: '1' };
    });

    it('should return validation errors when present', async () => {
      const errors = [{ msg: 'Invalid artist ID' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

      await adminController.removeArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors });
    });

    it('should return 404 when artist not found', async () => {
      Artist.findByPk.mockResolvedValue(null);

      await adminController.removeArtist(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Artist not found" });
    });

    it('should return 400 when artist has active auctions', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockUser = { userId: 1 };
      const mockAuctionRequest = { status: 'scheduled', auctionId: 'auction1' };
      const mockFirebaseSnapshot = {
        val: () => ({ status: 'active' })
      };
      const mockAuctionRef = {
        once: jest.fn().mockResolvedValue(mockFirebaseSnapshot)
      };

      Artist.findByPk.mockResolvedValue(mockArtist);
      User.findByPk.mockResolvedValue(mockUser);
      CustomizationResponse.findAll.mockResolvedValue([]);
      Product.findAll.mockResolvedValue([]);
      AuctionRequest.findAll.mockResolvedValue([mockAuctionRequest]);
      firebase_db.ref.mockReturnValue(mockAuctionRef);

      await adminController.removeArtist(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Cannot remove artist with active auctions. Please wait for auctions to end."
      });
    });

    it('should successfully remove artist and all associated data', async () => {
      const mockArtist = { 
        artistId: 1, 
        userId: 1,
        profilePicture: null,
        profileVideo: null,
        destroy: jest.fn()
      };
      const mockUser = { userId: 1, destroy: jest.fn() };
      const mockProduct = { 
        productId: 1, 
        image: null,
        destroy: jest.fn()
      };

      Artist.findByPk.mockResolvedValue(mockArtist);
      User.findByPk.mockResolvedValue(mockUser);
      CustomizationResponse.findAll.mockResolvedValue([]);
      Product.findAll.mockResolvedValue([mockProduct]);
      AuctionRequest.findAll.mockResolvedValue([]);
      CustomizationResponse.destroy.mockResolvedValue();
      ArtistFollow.destroy.mockResolvedValue();
      Report.destroy.mockResolvedValue();

      await adminController.removeArtist(req, res);

      expect(mockArtist.destroy).toHaveBeenCalled();
      expect(mockUser.destroy).toHaveBeenCalled();
      expect(mockProduct.destroy).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Artist and all associated data removed successfully"
      });
    });

    it('should handle scheduled auctions properly', async () => {
      const mockArtist = { 
        artistId: 1, 
        userId: 1,
        destroy: jest.fn()
      };
      const mockUser = { userId: 1, destroy: jest.fn() };
      const mockAuctionRequest = { 
        status: 'scheduled', 
        auctionId: 'auction1',
        update: jest.fn()
      };
      const mockFirebaseSnapshot = {
        val: () => ({ status: 'scheduled' })
      };
      const mockAuctionRef = {
        once: jest.fn().mockResolvedValue(mockFirebaseSnapshot),
        remove: jest.fn()
      };

      Artist.findByPk.mockResolvedValue(mockArtist);
      User.findByPk.mockResolvedValue(mockUser);
      CustomizationResponse.findAll.mockResolvedValue([]);
      Product.findAll.mockResolvedValue([]);
      AuctionRequest.findAll.mockResolvedValue([mockAuctionRequest]);
      firebase_db.ref.mockReturnValue(mockAuctionRef);
      CustomizationResponse.destroy.mockResolvedValue();
      ArtistFollow.destroy.mockResolvedValue();
      Report.destroy.mockResolvedValue();

      await adminController.removeArtist(req, res);

      expect(mockAuctionRef.remove).toHaveBeenCalled();
      expect(mockAuctionRequest.update).toHaveBeenCalledWith({
        status: 'rejected',
        adminNotes: 'Auction rejected due to artist account removal'
      }, { transaction: mockTransaction });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('addAdmin', () => {
    beforeEach(() => {
      req.body = {
        name: 'New Admin',
        email: 'newadmin@test.com',
        password: 'password123',
        username: 'newadmin',
        phone: '1234567890'
      };
    });

    it('should return validation errors when present', async () => {
      const errors = [{ msg: 'Invalid data' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

      await adminController.addAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors });
    });

    it('should return 403 when user is not authorized admin', async () => {
      Admin.findOne.mockResolvedValue(null);

      await adminController.addAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "You are not authorized to add an admin"
      });
    });

    it('should return 400 when required fields are missing', async () => {
      req.body = { name: 'Admin' };
      const mockAdmin = { adminId: 1 };
      Admin.findOne.mockResolvedValue(mockAdmin);

      await adminController.addAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Please fill all required fields",
        required: ['name', 'email', 'password', 'username', 'phone']
      });
    });

    it('should return 400 when email already exists', async () => {
      const mockAdmin = { adminId: 1 };
      const mockExistingUser = { userId: 2, email: 'newadmin@test.com' };
      
      Admin.findOne.mockResolvedValue(mockAdmin);
      User.findOne.mockResolvedValue(mockExistingUser);

      await adminController.addAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Email already exists" });
    });

    it('should return 400 when username already exists', async () => {
      const mockAdmin = { adminId: 1 };
      const mockExistingAdmin = { adminId: 2, username: 'newadmin' };
      
      Admin.findOne.mockResolvedValueOnce(mockAdmin).mockResolvedValueOnce(mockExistingAdmin);
      User.findOne.mockResolvedValue(null);

      await adminController.addAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Username already exists" });
    });

    it('should successfully create new admin', async () => {
      const mockAdmin = { adminId: 1 };
      const mockNewUser = { userId: 2 };
      const mockNewAdmin = {
        adminId: 2,
        name: 'New Admin',
        username: 'newadmin',
        phone: '1234567890',
        userId: 2
      };

      Admin.findOne.mockResolvedValueOnce(mockAdmin).mockResolvedValueOnce(null);
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockNewUser);
      Admin.create.mockResolvedValue(mockNewAdmin);
      bcrypt.hash.mockResolvedValue('hashedpassword');

      await adminController.addAdmin(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(User.create).toHaveBeenCalledWith({
        email: 'newadmin@test.com',
        password: 'hashedpassword',
        role: 'admin'
      }, { transaction: mockTransaction });
      expect(Admin.create).toHaveBeenCalledWith({
        name: 'New Admin',
        username: 'newadmin',
        phone: '1234567890',
        userId: 2
      }, { transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Admin created successfully",
        admin: {
          adminId: 2,
          name: 'New Admin',
          username: 'newadmin',
          phone: '1234567890',
          userId: 2
        }
      });
    });

    it('should handle database transaction error', async () => {
      const mockAdmin = { adminId: 1 };
      
      Admin.findOne.mockResolvedValueOnce(mockAdmin).mockResolvedValueOnce(null);
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('Database error'));
      bcrypt.hash.mockResolvedValue('hashedpassword');

      await adminController.addAdmin(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
  });
});
