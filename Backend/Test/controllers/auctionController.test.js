jest.mock('../../src/config/firebase', () => ({
  firebase_db: {
    ref: jest.fn()
  }
}));
jest.mock('../../src/models/product', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn()
}));
jest.mock('../../src/models/artist', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn()
}));
jest.mock('../../src/models/artistFollow', () => ({
  findOne: jest.fn()
}));
jest.mock('../../src/models/category', () => ({
  findAll: jest.fn()
}));

const auctionController = require('../../src/controllers/auctionController');
const { firebase_db } = require('../../src/config/firebase');
const Product = require('../../src/models/product');
const Artist = require('../../src/models/artist');
const ArtistFollow = require('../../src/models/artistFollow');
const Category = require('../../src/models/category');

describe('Auction Controller', () => {
  let req, res, mockFirebaseRef;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockFirebaseRef = {
      once: jest.fn(),
      update: jest.fn()
    };
    jest.clearAllMocks();
    firebase_db.ref.mockReturnValue(mockFirebaseRef);
  });

  describe('getAuctions', () => {
    it('should return all auctions successfully', async () => {
      const mockAuctionsData = {
        auction1: {
          id: 'auction1',
          productId: 1,
          artistId: 1,
          status: 'active',
          startDate: new Date('2025-01-01').toISOString(),
          endDate: new Date('2025-12-31').toISOString(),
          createdAt: new Date('2025-01-01').toISOString()
        },
        auction2: {
          id: 'auction2',
          productId: 2,
          artistId: 2,
          status: 'scheduled',
          startDate: new Date('2025-01-01').toISOString(),
          endDate: new Date('2025-12-31').toISOString(),
          createdAt: new Date('2025-01-02').toISOString()
        }
      };

      const mockArtists = [
        { artistId: 1, name: 'Artist 1', username: 'artist1' },
        { artistId: 2, name: 'Artist 2', username: 'artist2' }
      ];

      const mockProducts = [
        { 
          productId: 1, 
          name: 'Product 1',
          category: { categoryId: 1, name: 'Category 1' }
        },
        { 
          productId: 2, 
          name: 'Product 2',
          category: { categoryId: 2, name: 'Category 2' }
        }
      ];

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionsData
      });
      Artist.findAll.mockResolvedValue(mockArtists);
      Product.findAll.mockResolvedValue(mockProducts);

      await auctionController.getAuctions(req, res);

      expect(firebase_db.ref).toHaveBeenCalledWith('auctions');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        auctions: expect.arrayContaining([
          expect.objectContaining({
            id: 'auction1',
            artist: expect.objectContaining({ artistId: 1, name: 'Artist 1' }),
            product: expect.objectContaining({ productId: 1, name: 'Product 1' })
          }),
          expect.objectContaining({
            id: 'auction2',
            artist: expect.objectContaining({ artistId: 2, name: 'Artist 2' }),
            product: expect.objectContaining({ productId: 2, name: 'Product 2' })
          })
        ])
      });
    });

    it('should filter auctions by status', async () => {
      req.query.status = 'active';
      
      const mockAuctionsData = {
        auction1: {
          status: 'active',
          productId: 1,
          artistId: 1,
          startDate: new Date('2025-01-01').toISOString(),
          endDate: new Date('2025-12-31').toISOString(),
          createdAt: new Date('2025-01-01').toISOString()
        },
        auction2: {
          status: 'scheduled',
          productId: 2,
          artistId: 2,
          startDate: new Date('2030-01-01').toISOString(),
          endDate: new Date('2030-12-31').toISOString(),
          createdAt: new Date('2025-01-02').toISOString()
        }
      };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionsData
      });
      Artist.findAll.mockResolvedValue([]);
      Product.findAll.mockResolvedValue([]);

      await auctionController.getAuctions(req, res);

      expect(res.json).toHaveBeenCalledWith({
        auctions: expect.arrayContaining([
          expect.objectContaining({ status: 'active' })
        ])
      });
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.auctions).toHaveLength(1);
      expect(responseData.auctions[0].status).toBe('active');
    });

    it('should filter auctions by category', async () => {
      req.query.category = '1';
      
      const mockAuctionsData = {
        auction1: {
          productId: 1,
          artistId: 1,
          status: 'active',
          startDate: new Date('2025-01-01').toISOString(),
          endDate: new Date('2025-12-31').toISOString(),
          createdAt: new Date('2025-01-01').toISOString()
        },
        auction2: {
          productId: 2,
          artistId: 2,
          status: 'active',
          startDate: new Date('2025-01-01').toISOString(),
          endDate: new Date('2025-12-31').toISOString(),
          createdAt: new Date('2025-01-02').toISOString()
        }
      };

      const mockCategoryProducts = [{ productId: 1 }];

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionsData
      });
      Product.findAll
        .mockResolvedValueOnce(mockCategoryProducts)
        .mockResolvedValueOnce([]);
      Artist.findAll.mockResolvedValue([]);

      await auctionController.getAuctions(req, res);

      expect(Product.findAll).toHaveBeenCalledWith({ where: { categoryId: '1' } });
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.auctions).toHaveLength(1);
      expect(responseData.auctions[0].productId).toBe(1);
    });

    it('should filter auctions by artist', async () => {
      req.query.artist = '1';
      
      const mockAuctionsData = {
        auction1: {
          productId: 1,
          artistId: 1,
          status: 'active',
          startDate: new Date('2025-01-01').toISOString(),
          endDate: new Date('2025-12-31').toISOString(),
          createdAt: new Date('2025-01-01').toISOString()
        },
        auction2: {
          productId: 2,
          artistId: 2,
          status: 'active',
          startDate: new Date('2025-01-01').toISOString(),
          endDate: new Date('2025-12-31').toISOString(),
          createdAt: new Date('2025-01-02').toISOString()
        }
      };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionsData
      });
      Artist.findAll.mockResolvedValue([]);
      Product.findAll.mockResolvedValue([]);

      await auctionController.getAuctions(req, res);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.auctions).toHaveLength(1);
      expect(responseData.auctions[0].artistId).toBe(1);
    });

    it('should handle empty auctions data', async () => {
      mockFirebaseRef.once.mockResolvedValue({
        val: () => null
      });
      Artist.findAll.mockResolvedValue([]);
      Product.findAll.mockResolvedValue([]);

      await auctionController.getAuctions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        auctions: []
      });
    });

    it('should update auction status from scheduled to active', async () => {
      const pastDate = new Date('2020-01-01').toISOString();
      const futureDate = new Date('2030-01-01').toISOString();
      
      const mockAuctionsData = {
        auction1: {
          productId: 1,
          artistId: 1,
          status: 'scheduled',
          startDate: pastDate,
          endDate: futureDate,
          createdAt: new Date('2025-01-01').toISOString()
        }
      };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionsData
      });
      Artist.findAll.mockResolvedValue([]);
      Product.findAll.mockResolvedValue([]);

      await auctionController.getAuctions(req, res);

      expect(mockFirebaseRef.update).toHaveBeenCalledWith({ status: 'active' });
    });

    it('should update auction status from active to ended', async () => {
      const pastStartDate = new Date('2020-01-01').toISOString();
      const pastEndDate = new Date('2020-01-02').toISOString();
      
      const mockAuctionsData = {
        auction1: {
          productId: 1,
          artistId: 1,
          status: 'active',
          startDate: pastStartDate,
          endDate: pastEndDate,
          createdAt: new Date('2025-01-01').toISOString()
        }
      };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionsData
      });
      Artist.findAll.mockResolvedValue([]);
      Product.findAll.mockResolvedValue([]);

      await auctionController.getAuctions(req, res);

      expect(mockFirebaseRef.update).toHaveBeenCalledWith({ status: 'ended' });
    });

    it('should handle internal server error', async () => {
      mockFirebaseRef.once.mockRejectedValue(new Error('Firebase error'));

      await auctionController.getAuctions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
    });
  });

  describe('getAuctionDetails', () => {
    beforeEach(() => {
      req.params = { auctionId: 'auction123' };
    });

    it('should return 400 when auction ID is missing', async () => {
      req.params = {};

      await auctionController.getAuctionDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Auction ID is required" });
    });

    it('should return 404 when auction not found', async () => {
      mockFirebaseRef.once.mockResolvedValue({
        val: () => null
      });

      await auctionController.getAuctionDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Auction not found" });
    });

    it('should return auction details successfully', async () => {
      const mockAuctionData = {
        productId: 1,
        artistId: 1,
        status: 'active',
        startDate: new Date('2025-01-01').toISOString(),
        endDate: new Date('2025-12-31').toISOString(),
        bids: {
          bid1: { bidAmount: 100, customerId: 1 },
          bid2: { bidAmount: 150, customerId: 2 }
        }
      };

      const mockProduct = {
        productId: 1,
        name: 'Test Product',
        category: { categoryId: 1, name: 'Test Category' }
      };

      const mockArtist = {
        artistId: 1,
        name: 'Test Artist',
        username: 'testartist'
      };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionData
      });
      Product.findByPk.mockResolvedValue(mockProduct);
      Artist.findByPk.mockResolvedValue(mockArtist);
      ArtistFollow.findOne.mockResolvedValue(null);

      await auctionController.getAuctionDetails(req, res);

      expect(firebase_db.ref).toHaveBeenCalledWith('auctions/auction123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        auction: expect.objectContaining({
          id: 'auction123',
          productId: 1,
          artistId: 1,
          status: 'active',
          bids: expect.arrayContaining([
            expect.objectContaining({ bidAmount: 150 }),
            expect.objectContaining({ bidAmount: 100 })
          ]),
          product: mockProduct,
          artist: mockArtist,
          isFollowing: false,
          timeRemaining: expect.any(Number),
          isEnded: expect.any(Boolean)
        })
      });
    });

    it('should check if user is following artist', async () => {
      req.user = { customerId: 1 };
      
      const mockAuctionData = {
        productId: 1,
        artistId: 1,
        status: 'active',
        startDate: new Date('2025-01-01').toISOString(),
        endDate: new Date('2025-12-31').toISOString()
      };

      const mockFollowRecord = { customerId: 1, artistId: 1 };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionData
      });
      Product.findByPk.mockResolvedValue({});
      Artist.findByPk.mockResolvedValue({ artistId: 1 });
      ArtistFollow.findOne.mockResolvedValue(mockFollowRecord);

      await auctionController.getAuctionDetails(req, res);

      expect(ArtistFollow.findOne).toHaveBeenCalledWith({
        where: {
          customerId: 1,
          artistId: 1
        }
      });
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.auction.isFollowing).toBe(true);
    });

    it('should update status from scheduled to active when start time passed', async () => {
      const pastDate = new Date('2020-01-01').toISOString();
      const futureDate = new Date('2030-01-01').toISOString();
      
      const mockAuctionData = {
        productId: 1,
        artistId: 1,
        status: 'scheduled',
        startDate: pastDate,
        endDate: futureDate
      };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionData
      });
      Product.findByPk.mockResolvedValue({});
      Artist.findByPk.mockResolvedValue({});

      await auctionController.getAuctionDetails(req, res);

      expect(mockFirebaseRef.update).toHaveBeenCalledWith({ status: 'active' });
    });

    it('should update status from active to ended when end time passed', async () => {
      const pastStartDate = new Date('2020-01-01').toISOString();
      const pastEndDate = new Date('2020-01-02').toISOString();
      
      const mockAuctionData = {
        productId: 1,
        artistId: 1,
        status: 'active',
        startDate: pastStartDate,
        endDate: pastEndDate
      };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionData
      });
      Product.findByPk.mockResolvedValue({});
      Artist.findByPk.mockResolvedValue({});

      await auctionController.getAuctionDetails(req, res);

      expect(mockFirebaseRef.update).toHaveBeenCalledWith({ status: 'ended' });
    });

    it('should handle internal server error', async () => {
      mockFirebaseRef.once.mockRejectedValue(new Error('Firebase error'));

      await auctionController.getAuctionDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
    });
  });

  describe('getAuctionProduct', () => {
    beforeEach(() => {
      req.params = { auctionId: 'auction123' };
    });

    it('should return 400 when auction ID is missing', async () => {
      req.params = {};

      await auctionController.getAuctionProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Auction ID is required" });
    });

    it('should return 404 when auction not found', async () => {
      mockFirebaseRef.once.mockResolvedValue({
        val: () => null
      });

      await auctionController.getAuctionProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Auction not found" });
    });

    it('should return 404 when product not found', async () => {
      const mockAuctionData = {
        productId: 1,
        artistId: 1
      };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionData
      });
      Product.findByPk.mockResolvedValue(null);

      await auctionController.getAuctionProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Product not found for this auction" });
    });

    it('should return auction product successfully without bids', async () => {
      const mockAuctionData = {
        productId: 1,
        artistId: 1
      };

      const mockProduct = {
        productId: 1,
        name: 'Test Product',
        artist: { artistId: 1, name: 'Test Artist', username: 'testartist' },
        category: { categoryId: 1, name: 'Test Category' }
      };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionData
      });
      Product.findByPk.mockResolvedValue(mockProduct);

      await auctionController.getAuctionProduct(req, res);

      expect(Product.findByPk).toHaveBeenCalledWith(1, {
        include: [
          {
            model: Artist,
            as: 'artist',
            attributes: ['artistId', 'name', 'username']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['categoryId', 'name']
          }
        ]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        product: mockProduct,
        highestBid: null
      });
    });

    it('should return auction product with highest bid', async () => {
      const mockAuctionData = {
        productId: 1,
        artistId: 1,
        bids: {
          bid1: { bidAmount: 100, customerId: 1 },
          bid2: { bidAmount: 150, customerId: 2 },
          bid3: { bidAmount: 120, customerId: 3 }
        }
      };

      const mockProduct = {
        productId: 1,
        name: 'Test Product'
      };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionData
      });
      Product.findByPk.mockResolvedValue(mockProduct);

      await auctionController.getAuctionProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        product: mockProduct,
        highestBid: expect.objectContaining({ bidAmount: 150 })
      });
    });

    it('should handle internal server error', async () => {
      mockFirebaseRef.once.mockRejectedValue(new Error('Firebase error'));

      await auctionController.getAuctionProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
    });
  });

  describe('getAuctionProductsByArtist', () => {
    beforeEach(() => {
      req.params = { artistId: '1' };
    });

    it('should return 400 when artist ID is missing', async () => {
      req.params = {};

      await auctionController.getAuctionProductsByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Artist ID is required" });
    });

    it('should return 404 when no auctions found for artist', async () => {
      const mockAuctionsData = {
        auction1: { artistId: 2, productId: 1 },
        auction2: { artistId: 3, productId: 2 }
      };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionsData
      });

      await auctionController.getAuctionProductsByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No auctions found for this artist" });
    });

    it('should return 404 when no products found for artist', async () => {
      const mockAuctionsData = {
        auction1: { artistId: 1, productId: 1 },
        auction2: { artistId: 1, productId: 2 }
      };

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionsData
      });
      Product.findAll.mockResolvedValue([]);

      await auctionController.getAuctionProductsByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No products found for this artist" });
    });

    it('should return auction products by artist successfully', async () => {
      const mockAuctionsData = {
        auction1: { artistId: 1, productId: 1 },
        auction2: { artistId: 1, productId: 2 },
        auction3: { artistId: 2, productId: 3 }
      };

      const mockProducts = [
        {
          productId: 1,
          name: 'Product 1',
          category: { categoryId: 1, name: 'Category 1' }
        },
        {
          productId: 2,
          name: 'Product 2',
          category: { categoryId: 2, name: 'Category 2' }
        }
      ];

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionsData
      });
      Product.findAll.mockResolvedValue(mockProducts);

      await auctionController.getAuctionProductsByArtist(req, res);

      expect(Product.findAll).toHaveBeenCalledWith({
        where: {
          artistId: '1',
          productId: [1, 2]
        },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['categoryId', 'name']
          }
        ]
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        auctions: expect.arrayContaining([
          expect.objectContaining({
            auction: expect.objectContaining({ artistId: 1, productId: 1 }),
            product: expect.objectContaining({ productId: 1, name: 'Product 1' })
          }),
          expect.objectContaining({
            auction: expect.objectContaining({ artistId: 1, productId: 2 }),
            product: expect.objectContaining({ productId: 2, name: 'Product 2' })
          })
        ]),
        products: mockProducts
      });
    });

    it('should handle auctions with missing products', async () => {
      const mockAuctionsData = {
        auction1: { artistId: 1, productId: 1 },
        auction2: { artistId: 1, productId: 2 }
      };

      const mockProducts = [
        {
          productId: 1,
          name: 'Product 1'
        }
      ];

      mockFirebaseRef.once.mockResolvedValue({
        val: () => mockAuctionsData
      });
      Product.findAll.mockResolvedValue(mockProducts);

      await auctionController.getAuctionProductsByArtist(req, res);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.auctions).toHaveLength(2);
      expect(responseData.auctions[0].product).not.toBeNull();
      expect(responseData.auctions[1].product).toBeNull();
    });

    it('should handle empty auctions data', async () => {
      mockFirebaseRef.once.mockResolvedValue({
        val: () => null
      });

      await auctionController.getAuctionProductsByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No auctions found for this artist" });
    });

    it('should handle internal server error', async () => {
      mockFirebaseRef.once.mockRejectedValue(new Error('Firebase error'));

      await auctionController.getAuctionProductsByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
    });
  });
});
