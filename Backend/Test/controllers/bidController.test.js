jest.mock('../../src/models/customer', () => ({
  findOne: jest.fn()
}));
jest.mock('../../src/models/user', () => ({
  findByPk: jest.fn()
}));
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));
jest.mock('../../src/config/firebase', () => ({
  firebase_db: {
    ref: jest.fn()
  }
}));
jest.mock('../../src/utils/emailService', () => ({
  sendBidReceivedEmail: jest.fn()
}));
jest.mock('../../src/utils/dateValidation', () => ({
  formatToLocaleString: jest.fn()
}));

const bidController = require('../../src/controllers/bidController');
const Customer = require('../../src/models/customer');
const User = require('../../src/models/user');
const { validationResult } = require('express-validator');
const { firebase_db } = require('../../src/config/firebase');
const { sendBidReceivedEmail } = require('../../src/utils/emailService');
const { formatToLocaleString } = require('../../src/utils/dateValidation');

describe('Bid Controller', () => {
  let req, res, mockRef, mockSnapshot, mockTransaction;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { id: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockSnapshot = {
      val: jest.fn(),
      exists: jest.fn()
    };
    
    mockTransaction = jest.fn();
    
    mockRef = {
      once: jest.fn().mockResolvedValue(mockSnapshot),
      update: jest.fn().mockResolvedValue(),
      transaction: mockTransaction
    };
    
    firebase_db.ref.mockReturnValue(mockRef);
    formatToLocaleString.mockImplementation((date) => date.toISOString());
    
    jest.clearAllMocks();
  });

  describe('placeBid', () => {
    it('should return validation errors when present', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ field: 'bidAmount', message: 'Invalid bid amount' }])
      };
      validationResult.mockReturnValue(mockErrors);

      await bidController.placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        errors: [{ field: 'bidAmount', message: 'Invalid bid amount' }] 
      });
    });

    it('should return 403 when user is not a customer', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      Customer.findOne.mockResolvedValue(null);

      await bidController.placeBid(req, res);

      expect(Customer.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Only customers can place bids' });
    });

    it('should return 404 when auction not found', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        bidAmount: 100
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);
      mockSnapshot.val.mockReturnValue(null);

      await bidController.placeBid(req, res);

      expect(firebase_db.ref).toHaveBeenCalledWith('auctions/auction123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Auction not found' });
    });

    it('should return 400 when auction is not active', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        bidAmount: 100
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const mockAuction = {
        status: 'ended',
        endDate: new Date().toISOString(),
        startingPrice: 50,
        currentPrice: 60
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      await bidController.placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'This auction is not active' });
    });

    it('should return 400 when auction has ended', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        bidAmount: 100
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const mockAuction = {
        status: 'active',
        endDate: pastDate.toISOString(),
        startingPrice: 50,
        currentPrice: 60
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      await bidController.placeBid(req, res);

      expect(mockRef.update).toHaveBeenCalledWith({ status: 'ended' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'This auction has ended' });
    });

    it('should return 400 when user already has a bid', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        bidAmount: 100
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
      const mockAuction = {
        status: 'active',
        endDate: futureDate.toISOString(),
        startingPrice: 50,
        currentPrice: 60,
        bids: {
          'bid1': { userId: 1, bidAmount: 70 },
          'bid2': { userId: 2, bidAmount: 80 }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      await bidController.placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You have already placed a bid on this auction. Please use the update bid feature to modify your bid.',
        existingBidAmount: 70
      });
    });

    it('should return 400 when user is already highest bidder', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        bidAmount: 100
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockAuction = {
        status: 'active',
        endDate: futureDate.toISOString(),
        startingPrice: 50,
        currentPrice: 80,
        bids: {
          'bid1': { userId: 1, bidAmount: 80 },
          'bid2': { userId: 2, bidAmount: 70 }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      await bidController.placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You have already placed a bid on this auction. Please use the update bid feature to modify your bid.',
        existingBidAmount: 80
      });
    });

    it('should return 400 when user is highest bidder without existing bid check', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        bidAmount: 100
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockAuction = {
        status: 'active',
        endDate: futureDate.toISOString(),
        startingPrice: 50,
        currentPrice: 80,
        bids: {
          'bid1': { userId: 2, bidAmount: 70 },
          'bid2': { userId: 1, bidAmount: 80 }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      await bidController.placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You have already placed a bid on this auction. Please use the update bid feature to modify your bid.',
        existingBidAmount: 80
      });
    });

    it('should return 400 when bid amount is too low', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        bidAmount: 64
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockAuction = {
        status: 'active',
        endDate: futureDate.toISOString(),
        startingPrice: 50,
        currentPrice: 60,
        incrementPercentage: 10,
        bids: {
          'bid1': { userId: 2, bidAmount: 60 }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      await bidController.placeBid(req, res);

      const minimumBid = 60 + (50 * 10) / 100;
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: `Bid must be at least ${minimumBid.toFixed(2)}`,
        minimumBid: minimumBid.toFixed(2)
      });
    });

    it('should successfully place a bid with Firebase transaction', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        bidAmount: 75
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockAuction = {
        status: 'active',
        endDate: futureDate.toISOString(),
        startingPrice: 50,
        currentPrice: 60,
        incrementPercentage: 10,
        bids: {
          'bid1': { userId: 2, bidAmount: 60 }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuction);
      const updatedAuction = {
        ...mockAuction,
        currentPrice: 75,
        bidCount: 2,
        lastBidder: 1
      };
      
      mockTransaction.mockImplementation((updateFunction, callback) => {
        const result = updateFunction(mockAuction);
        callback(null, true, { val: () => updatedAuction });
      });

      const mockUser = { email: 'test@example.com' };
      User.findByPk.mockResolvedValue(mockUser);
      sendBidReceivedEmail.mockResolvedValue();

      await bidController.placeBid(req, res);

      expect(mockTransaction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Bid placed successfully',
        currentPrice: 75,
        bidCount: 2
      });
    });

    it('should extend auction time if bid placed within 5 minutes of end', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        bidAmount: 75
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);
      const now = new Date();
      const nearEndDate = new Date(now.getTime() + 3 * 60 * 1000);
      const mockAuction = {
        status: 'active',
        endDate: nearEndDate.toISOString(),
        startingPrice: 50,
        currentPrice: 60,
        incrementPercentage: 10,
        bids: {
          'bid1': { userId: 2, bidAmount: 60 }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuction);
      formatToLocaleString.mockImplementation((date) => {
        if (date.getTime() === nearEndDate.getTime()) {
          return nearEndDate.toISOString();
        }
        return date.toISOString();
      });

      let updatedAuction = null;
      mockTransaction.mockImplementation((updateFunction, callback) => {
        const auctionCopy = JSON.parse(JSON.stringify(mockAuction));
        updatedAuction = updateFunction(auctionCopy);
        callback(null, true, { val: () => updatedAuction });
      });

      await bidController.placeBid(req, res);
      expect(updatedAuction).not.toBeNull();
      expect(updatedAuction.endDate).not.toBe(mockAuction.endDate);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle transaction error', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        bidAmount: 75
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockAuction = {
        status: 'active',
        endDate: futureDate.toISOString(),
        startingPrice: 50,
        currentPrice: 60,
        incrementPercentage: 10
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      mockTransaction.mockImplementation((updateFunction, callback) => {
        callback(new Error('Transaction failed'), false, null);
      });

      await bidController.placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error placing bid: Transaction failed' });
    });

    it('should handle internal server error', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await bidController.placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getBidsByAuction', () => {
    it('should return 404 when auction not found', async () => {
      req.params = { auctionId: 'auction123' };
      mockSnapshot.val.mockReturnValue(null);

      await bidController.getBidsByAuction(req, res);

      expect(firebase_db.ref).toHaveBeenCalledWith('auctions/auction123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Auction not found' });
    });

    it('should return auction bids successfully', async () => {
      req.params = { auctionId: 'auction123' };

      const mockAuction = {
        currentPrice: 100,
        bidCount: 2,
        bids: {
          'bid1': { userId: 1, bidAmount: 80, timestamp: '2025-07-04T10:00:00Z' },
          'bid2': { userId: 2, bidAmount: 100, timestamp: '2025-07-04T11:00:00Z' }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      await bidController.getBidsByAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        auctionId: 'auction123',
        currentPrice: 100,
        bidCount: 2,
        bids: [
          { id: 'bid2', userId: 2, bidAmount: 100, timestamp: '2025-07-04T11:00:00Z' },
          { id: 'bid1', userId: 1, bidAmount: 80, timestamp: '2025-07-04T10:00:00Z' }
        ]
      });
    });

    it('should return auction with no bids', async () => {
      req.params = { auctionId: 'auction123' };

      const mockAuction = {
        currentPrice: 50,
        bidCount: 0
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      await bidController.getBidsByAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        auctionId: 'auction123',
        currentPrice: 50,
        bidCount: 0,
        bids: []
      });
    });

    it('should handle internal server error', async () => {
      req.params = { auctionId: 'auction123' };
      mockRef.once.mockRejectedValue(new Error('Firebase error'));

      await bidController.getBidsByAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getMyBids', () => {
    it('should return 403 when user is not a customer', async () => {
      Customer.findOne.mockResolvedValue(null);

      await bidController.getMyBids(req, res);

      expect(Customer.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Only customers can view their bids' });
    });

    it('should return user bids successfully', async () => {
      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const mockAuctions = {
        'auction1': {
          productId: 'product1',
          currentPrice: 100,
          endDate: '2025-07-05T12:00:00Z',
          status: 'active',
          lastBidder: 1,
          bids: {
            'bid1': { userId: 1, bidAmount: 100, timestamp: '2025-07-04T11:00:00Z' },
            'bid2': { userId: 2, bidAmount: 90, timestamp: '2025-07-04T10:00:00Z' }
          }
        },
        'auction2': {
          productId: 'product2',
          currentPrice: 80,
          endDate: '2025-07-06T12:00:00Z',
          status: 'active',
          lastBidder: 2,
          bids: {
            'bid3': { userId: 1, bidAmount: 70, timestamp: '2025-07-04T09:00:00Z' }
          }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuctions);

      await bidController.getMyBids(req, res);

      expect(firebase_db.ref).toHaveBeenCalledWith('auctions');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        {
          bidId: 'bid1',
          auctionId: 'auction1',
          bidAmount: 100,
          timestamp: '2025-07-04T11:00:00Z',
          isHighestBid: true,
          auctionDetails: {
            productId: 'product1',
            currentPrice: 100,
            endDate: '2025-07-05T12:00:00Z',
            status: 'active',
            timeRemaining: expect.any(Number)
          }
        },
        {
          bidId: 'bid3',
          auctionId: 'auction2',
          bidAmount: 70,
          timestamp: '2025-07-04T09:00:00Z',
          isHighestBid: false,
          auctionDetails: {
            productId: 'product2',
            currentPrice: 80,
            endDate: '2025-07-06T12:00:00Z',
            status: 'active',
            timeRemaining: expect.any(Number)
          }
        }
      ]);
    });

    it('should return empty array when user has no bids', async () => {
      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      mockSnapshot.val.mockReturnValue({});

      await bidController.getMyBids(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await bidController.getMyBids(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getTodayBids', () => {
    it('should return today\'s bids successfully', async () => {
      const today = new Date();
      const todayString = today.toISOString();
      
      const mockAuctions = {
        'auction1': {
          productId: 'product1',
          currentPrice: 100,
          endDate: '2025-07-05T12:00:00Z',
          status: 'active',
          bids: {
            'bid1': { userId: 1, bidAmount: 100, timestamp: todayString },
            'bid2': { userId: 2, bidAmount: 90, timestamp: '2025-07-03T10:00:00Z' } // Yesterday
          }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuctions);
      formatToLocaleString.mockReturnValue('7/4/2025, 12:00:00 PM');

      await bidController.getTodayBids(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        date: '7/4/2025',
        totalBids: 1,
        bids: [
          {
            auctionId: 'auction1',
            bidId: 'bid1',
            userId: 1,
            bidAmount: 100,
            timestamp: todayString,
            auctionDetails: {
              productId: 'product1',
              currentPrice: 100,
              endDate: '2025-07-05T12:00:00Z',
              status: 'active'
            }
          }
        ]
      });
    });

    it('should return empty array when no bids today', async () => {
      mockSnapshot.val.mockReturnValue({});
      formatToLocaleString.mockReturnValue('7/4/2025, 12:00:00 PM');

      await bidController.getTodayBids(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        date: '7/4/2025',
        totalBids: 0,
        bids: []
      });
    });

    it('should handle internal server error', async () => {
      mockRef.once.mockRejectedValue(new Error('Firebase error'));

      await bidController.getTodayBids(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('updateBid', () => {
    it('should return validation errors when present', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ field: 'newBidAmount', message: 'Invalid bid amount' }])
      };
      validationResult.mockReturnValue(mockErrors);

      await bidController.updateBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        errors: [{ field: 'newBidAmount', message: 'Invalid bid amount' }] 
      });
    });

    it('should return 403 when user is not a customer', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      Customer.findOne.mockResolvedValue(null);

      await bidController.updateBid(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Only customers can update bids' });
    });

    it('should return 404 when user has no existing bid', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        newBidAmount: 120
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockAuction = {
        status: 'active',
        endDate: futureDate.toISOString(),
        startingPrice: 50,
        currentPrice: 100,
        bids: {
          'bid1': { userId: 2, bidAmount: 100 }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      await bidController.updateBid(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'You have not placed a bid on this auction' });
    });

    it('should return 400 when user is already highest bidder', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        newBidAmount: 120
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockAuction = {
        status: 'active',
        endDate: futureDate.toISOString(),
        startingPrice: 50,
        currentPrice: 100,
        bids: {
          'bid1': { userId: 1, bidAmount: 100 },
          'bid2': { userId: 2, bidAmount: 90 }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      await bidController.updateBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You cannot update your bid because you are already the highest bidder'
      });
    });

    it('should return 400 when new bid amount is not higher than existing bid', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        newBidAmount: 80
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockAuction = {
        status: 'active',
        endDate: futureDate.toISOString(),
        startingPrice: 50,
        currentPrice: 100,
        bids: {
          'bid1': { userId: 1, bidAmount: 80 },
          'bid2': { userId: 2, bidAmount: 100 }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      await bidController.updateBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Bid must be at least 80.01',
        minimumBid: '80.01'
      });
    });

    it('should successfully update bid with Firebase transaction', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        auctionId: 'auction123',
        newBidAmount: 150
      };

      const mockCustomer = { customerId: 1, name: 'Test Customer' };
      Customer.findOne.mockResolvedValue(mockCustomer);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockAuction = {
        status: 'active',
        endDate: futureDate.toISOString(),
        startingPrice: 50,
        currentPrice: 120,
        incrementPercentage: 10,
        bids: {
          'bid1': { userId: 1, bidAmount: 100 },
          'bid2': { userId: 2, bidAmount: 120 }
        }
      };
      mockSnapshot.val.mockReturnValue(mockAuction);

      const updatedAuction = {
        ...mockAuction,
        currentPrice: 150,
        lastBidder: 1,
        bids: {
          ...mockAuction.bids,
          'bid1': { ...mockAuction.bids['bid1'], bidAmount: 150 }
        }
      };

      mockTransaction.mockImplementation((updateFunction, callback) => {
        const result = updateFunction(mockAuction);
        callback(null, true, { val: () => updatedAuction });
      });

      const mockUser = { email: 'test@example.com' };
      User.findByPk.mockResolvedValue(mockUser);
      sendBidReceivedEmail.mockResolvedValue();

      await bidController.updateBid(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Bid updated successfully',
        bidId: 'bid1',
        oldBidAmount: 100,
        newBidAmount: 150,
        currentPrice: 150,
        bidCount: undefined
      });
    });

    it('should handle internal server error', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await bidController.updateBid(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});
