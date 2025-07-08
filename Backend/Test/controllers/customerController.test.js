jest.mock('../../src/models/customer', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn()
}));
jest.mock('../../src/models/user', () => ({
  findOne: jest.fn()
}));
jest.mock('../../src/models/artist', () => ({
  findByPk: jest.fn(),
  findAll: jest.fn()
}));
jest.mock('../../src/models/artistFollow', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  count: jest.fn()
}));
jest.mock('../../src/models/product', () => ({
  findAll: jest.fn()
}));

jest.mock('sequelize', () => ({
  Op: {
    or: Symbol('or'),
    iLike: Symbol('iLike')
  }
}));

const customer = require('../../src/models/customer');
const User = require('../../src/models/user');
const Artist = require('../../src/models/artist');
const ArtistFollow = require('../../src/models/artistFollow');
const Product = require('../../src/models/product');
const customerController = require('../../src/controllers/customerController');

describe('Customer Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should return 403 when user is not found', async () => {
      User.findOne.mockResolvedValue(null);

      await customerController.updateProfile(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    });

    it('should return 403 when user is not a customer', async () => {
      User.findOne.mockResolvedValue({ userId: 1, role: 'artist' });

      await customerController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    });

    it('should return 400 when required fields are missing', async () => {
      User.findOne.mockResolvedValue({ userId: 1, role: 'customer' });
      req.body = { name: 'John' };

      await customerController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Please fill all fields",
        required: ['name', 'username', 'phone', 'address']
      });
    });

    it('should update existing customer profile successfully', async () => {
      const mockUser = { userId: 1, role: 'customer' };
      const mockCustomer = {
        customerId: 1,
        userId: 1,
        name: 'OldName',
        username: 'oldusername',
        phone: '123456789',
        address: 'Old Address',
        save: jest.fn().mockResolvedValue()
      };
      
      User.findOne.mockResolvedValue(mockUser);
      customer.findOne
        .mockResolvedValueOnce(mockCustomer)
        .mockResolvedValueOnce(null);

      req.body = {
        name: 'NewName',
        username: 'newusername',
        phone: '987654321',
        address: 'New Address'
      };

      await customerController.updateProfile(req, res);

      expect(mockCustomer.name).toBe('NewName');
      expect(mockCustomer.username).toBe('newusername');
      expect(mockCustomer.phone).toBe('987654321');
      expect(mockCustomer.address).toBe('New Address');
      expect(mockCustomer.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ existingCustomer: mockCustomer });
    });

    it('should return 400 when updating to existing username', async () => {
      const mockUser = { userId: 1, role: 'customer' };
      const mockCustomer = {
        customerId: 1,
        userId: 1,
        username: 'oldusername'
      };
      
      User.findOne.mockResolvedValue(mockUser);
      customer.findOne
        .mockResolvedValueOnce(mockCustomer)
        .mockResolvedValueOnce({ customerId: 2, username: 'newusername' });

      req.body = {
        name: 'NewName',
        username: 'newusername',
        phone: '987654321',
        address: 'New Address'
      };

      await customerController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Username already exists" });
    });

    it('should create new customer profile successfully', async () => {
      const mockUser = { userId: 1, role: 'customer' };
      const mockNewCustomer = {
        customerId: 1,
        name: 'NewName',
        username: 'newusername',
        phone: '987654321',
        address: 'New Address',
        userId: 1
      };
      
      User.findOne.mockResolvedValue(mockUser);
      customer.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      customer.create.mockResolvedValue(mockNewCustomer);

      req.body = {
        name: 'NewName',
        username: 'newusername',
        phone: '987654321',
        address: 'New Address'
      };

      await customerController.updateProfile(req, res);

      expect(customer.create).toHaveBeenCalledWith({
        name: 'NewName',
        username: 'newusername',
        phone: '987654321',
        address: 'New Address',
        userId: 1
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ customerProfile: mockNewCustomer });
    });

    it('should return 400 when creating with existing username', async () => {
      const mockUser = { userId: 1, role: 'customer' };
      
      User.findOne.mockResolvedValue(mockUser);
      customer.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ customerId: 2, username: 'existingusername' });

      req.body = {
        name: 'NewName',
        username: 'existingusername',
        phone: '987654321',
        address: 'New Address'
      };

      await customerController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Username already exists" });
      expect(customer.create).not.toHaveBeenCalled();
    });

    it('should handle internal server error', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customerController.updateProfile(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error updating customer profile:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });

      consoleSpy.mockRestore();
    });
  });

  describe('getProfile', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should return customer profile successfully', async () => {
      const mockCustomer = {
        customerId: 1,
        name: 'John Doe',
        username: 'johndoe',
        phone: '123456789',
        address: 'Test Address',
        userId: 1
      };

      customer.findOne.mockResolvedValue(mockCustomer);

      await customerController.getProfile(req, res);

      expect(customer.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ customerProfile: mockCustomer });
    });

    it('should return 404 when customer profile not found', async () => {
      customer.findOne.mockResolvedValue(null);

      await customerController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Customer profile not found" });
    });

    it('should handle internal server error', async () => {
      customer.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customerController.getProfile(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error getting customer profile:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });

      consoleSpy.mockRestore();
    });
  });

  describe('followArtist', () => {
    beforeEach(() => {
      req.user = { id: 1 };
      req.params = { artistId: '2' };
    });

    it('should follow artist successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockArtist = { artistId: 2, name: 'Artist Name' };

      customer.findOne.mockResolvedValue(mockCustomer);
      Artist.findByPk.mockResolvedValue(mockArtist);
      ArtistFollow.findOne.mockResolvedValue(null);
      ArtistFollow.create.mockResolvedValue({});

      await customerController.followArtist(req, res);

      expect(customer.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(Artist.findByPk).toHaveBeenCalledWith('2');
      expect(ArtistFollow.findOne).toHaveBeenCalledWith({
        where: {
          customerId: 1,
          artistId: 2
        }
      });
      expect(ArtistFollow.create).toHaveBeenCalledWith({
        customerId: 1,
        artistId: 2
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Successfully followed artist' });
    });

    it('should return 403 when customer profile not found', async () => {
      customer.findOne.mockResolvedValue(null);

      await customerController.followArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'You must have a customer profile to follow artists' });
      expect(Artist.findByPk).not.toHaveBeenCalled();
    });

    it('should return 404 when artist not found', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };

      customer.findOne.mockResolvedValue(mockCustomer);
      Artist.findByPk.mockResolvedValue(null);

      await customerController.followArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Artist not found' });
      expect(ArtistFollow.findOne).not.toHaveBeenCalled();
    });

    it('should return 400 when already following artist', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockArtist = { artistId: 2, name: 'Artist Name' };
      const mockFollow = { customerId: 1, artistId: 2 };

      customer.findOne.mockResolvedValue(mockCustomer);
      Artist.findByPk.mockResolvedValue(mockArtist);
      ArtistFollow.findOne.mockResolvedValue(mockFollow);

      await customerController.followArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'You are already following this artist' });
      expect(ArtistFollow.create).not.toHaveBeenCalled();
    });

    it('should handle internal server error', async () => {
      customer.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customerController.followArtist(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error following artist:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('unfollowArtist', () => {
    beforeEach(() => {
      req.user = { id: 1 };
      req.params = { artistId: '2' };
    });

    it('should unfollow artist successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockArtist = { artistId: 2, name: 'Artist Name' };
      const mockFollow = {
        customerId: 1,
        artistId: 2,
        destroy: jest.fn().mockResolvedValue()
      };

      customer.findOne.mockResolvedValue(mockCustomer);
      Artist.findByPk.mockResolvedValue(mockArtist);
      ArtistFollow.findOne.mockResolvedValue(mockFollow);

      await customerController.unfollowArtist(req, res);

      expect(mockFollow.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Successfully unfollowed artist' });
    });

    it('should return 403 when customer profile not found', async () => {
      customer.findOne.mockResolvedValue(null);

      await customerController.unfollowArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'You must have a customer profile to unfollow artists' });
    });

    it('should return 404 when artist not found', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };

      customer.findOne.mockResolvedValue(mockCustomer);
      Artist.findByPk.mockResolvedValue(null);

      await customerController.unfollowArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Artist not found' });
    });

    it('should return 400 when not following artist', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockArtist = { artistId: 2, name: 'Artist Name' };

      customer.findOne.mockResolvedValue(mockCustomer);
      Artist.findByPk.mockResolvedValue(mockArtist);
      ArtistFollow.findOne.mockResolvedValue(null);

      await customerController.unfollowArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'You are not following this artist' });
    });

    it('should handle internal server error', async () => {
      customer.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customerController.unfollowArtist(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error unfollowing artist:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getFollowing', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should return followed artists successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockFollows = [
        {
          customerId: 1,
          artistId: 2,
          artist: {
            artistId: 2,
            name: 'Artist One',
            username: 'artist1',
            profilePicture: 'pic1.jpg',
            biography: 'Bio 1'
          }
        },
        {
          customerId: 1,
          artistId: 3,
          artist: {
            artistId: 3,
            name: 'Artist Two',
            username: 'artist2',
            profilePicture: 'pic2.jpg',
            biography: 'Bio 2'
          }
        }
      ];

      customer.findOne.mockResolvedValue(mockCustomer);
      ArtistFollow.findAll.mockResolvedValue(mockFollows);

      await customerController.getFollowing(req, res);

      expect(ArtistFollow.findAll).toHaveBeenCalledWith({
        where: { customerId: 1 },
        include: [{
          model: Artist,
          attributes: ['artistId', 'name', 'username', 'profilePicture', 'biography']
        }]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        followedArtists: [mockFollows[0].artist, mockFollows[1].artist]
      });
    });

    it('should return 403 when customer profile not found', async () => {
      customer.findOne.mockResolvedValue(null);

      await customerController.getFollowing(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'You must have a customer profile to view followed artists' });
    });

    it('should return empty array when no follows exist', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };

      customer.findOne.mockResolvedValue(mockCustomer);
      ArtistFollow.findAll.mockResolvedValue([]);

      await customerController.getFollowing(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ followedArtists: [] });
    });

    it('should handle internal server error', async () => {
      customer.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customerController.getFollowing(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error getting followed artists:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('searchArtistsAndProducts', () => {
    it('should search artists and products successfully', async () => {
      req.query = { query: 'test' };
      req.user = { id: 1 };

      const mockCustomer = { customerId: 1, userId: 1 };
      const mockArtists = [
        {
          artistId: 1,
          name: 'Test Artist',
          username: 'testartist',
          profilePicture: 'pic.jpg',
          biography: 'Test bio',
          dataValues: {
            artistId: 1,
            name: 'Test Artist',
            username: 'testartist',
            profilePicture: 'pic.jpg',
            biography: 'Test bio'
          }
        }
      ];
      const mockProducts = [
        {
          productId: 1,
          name: 'Test Product',
          price: 100,
          description: 'Test description',
          image: 'product.jpg',
          quantity: 10,
          material: 'wood',
          type: 'normal',
          artist: {
            artistId: 1,
            name: 'Test Artist',
            username: 'testartist',
            profilePicture: 'pic.jpg'
          },
          dataValues: {
            productId: 1,
            name: 'Test Product',
            price: 100,
            description: 'Test description',
            image: 'product.jpg',
            quantity: 10,
            material: 'wood',
            type: 'normal',
            artist: {
              artistId: 1,
              name: 'Test Artist',
              username: 'testartist',
              profilePicture: 'pic.jpg'
            }
          }
        }
      ];

      customer.findOne.mockResolvedValue(mockCustomer);
      Artist.findAll.mockResolvedValue(mockArtists);
      Product.findAll.mockResolvedValue(mockProducts);
      ArtistFollow.count.mockResolvedValue(5);
      ArtistFollow.findOne.mockResolvedValue({ customerId: 1, artistId: 1 });

      await customerController.searchArtistsAndProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        artists: [{
          artistId: 1,
          name: 'Test Artist',
          username: 'testartist',
          profilePicture: 'pic.jpg',
          biography: 'Test bio',
          followersCount: 5,
          isFollowing: true,
          type: 'artist'
        }],
        products: [{
          productId: 1,
          name: 'Test Product',
          price: 100,
          description: 'Test description',
          image: 'product.jpg',
          quantity: 10,
          material: 'wood',
          type: 'product',
          artist: {
            artistId: 1,
            name: 'Test Artist',
            username: 'testartist',
            profilePicture: 'pic.jpg'
          }
        }],
        totalResults: 2
      });
    });

    it('should return 400 when query is too short', async () => {
      req.query = { query: 'a' };

      await customerController.searchArtistsAndProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Search query must be at least 2 characters long' });
    });

    it('should return 400 when query is missing', async () => {
      req.query = {};

      await customerController.searchArtistsAndProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Search query must be at least 2 characters long' });
    });

    it('should handle search without authenticated user', async () => {
      req.query = { query: 'test' };
      req.user = undefined;

      const mockArtists = [{
        artistId: 1,
        name: 'Test Artist',
        username: 'testartist',
        profilePicture: 'pic.jpg',
        biography: 'Test bio',
        dataValues: {
          artistId: 1,
          name: 'Test Artist',
          username: 'testartist',
          profilePicture: 'pic.jpg',
          biography: 'Test bio'
        }
      }];

      Artist.findAll.mockResolvedValue(mockArtists);
      Product.findAll.mockResolvedValue([]);
      ArtistFollow.count.mockResolvedValue(3);

      await customerController.searchArtistsAndProducts(req, res);

      expect(customer.findOne).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        artists: [{
          artistId: 1,
          name: 'Test Artist',
          username: 'testartist',
          profilePicture: 'pic.jpg',
          biography: 'Test bio',
          followersCount: 3,
          isFollowing: false,
          type: 'artist'
        }],
        products: [],
        totalResults: 1
      });
    });

    it('should handle internal server error', async () => {
      req.query = { query: 'test' };
      Artist.findAll.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customerController.searchArtistsAndProducts(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error searching artists and products:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getAllCustomers', () => {
    it('should return all customers successfully', async () => {
      const mockCustomers = [
        {
          customerId: 1,
          createdAt: '2023-01-01T00:00:00.000Z',
          user: {
            userId: 1,
            email: 'customer1@test.com',
            isBanned: false
          }
        },
        {
          customerId: 2,
          createdAt: '2023-01-02T00:00:00.000Z',
          user: {
            userId: 2,
            email: 'customer2@test.com',
            isBanned: true
          }
        }
      ];

      customer.findAll.mockResolvedValue(mockCustomers);

      await customerController.getAllCustomers(req, res);

      expect(customer.findAll).toHaveBeenCalledWith({
        attributes: ['customerId', 'createdAt'],
        include: [{
          model: User,
          attributes: ['userId', 'email', 'isBanned']
        }],
        order: [['createdAt', 'DESC']]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        customers: [
          {
            customerId: 1,
            userId: 1,
            createdAt: '2023-01-01T00:00:00.000Z',
            banned: false,
            email: 'customer1@test.com'
          },
          {
            customerId: 2,
            userId: 2,
            createdAt: '2023-01-02T00:00:00.000Z',
            banned: true,
            email: 'customer2@test.com'
          }
        ]
      });
    });

    it('should handle customers without user data', async () => {
      const mockCustomers = [
        {
          customerId: 1,
          createdAt: '2023-01-01T00:00:00.000Z',
          user: null
        }
      ];

      customer.findAll.mockResolvedValue(mockCustomers);

      await customerController.getAllCustomers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        customers: [{
          customerId: 1,
          userId: undefined,
          createdAt: '2023-01-01T00:00:00.000Z',
          banned: false,
          email: undefined
        }]
      });
    });

    it('should return empty array when no customers exist', async () => {
      customer.findAll.mockResolvedValue([]);

      await customerController.getAllCustomers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ customers: [] });
    });

    it('should handle internal server error', async () => {
      customer.findAll.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customerController.getAllCustomers(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching all customers:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases and Additional Scenarios', () => {
    it('should handle whitespace-only query in search', async () => {
      req.query = { query: '   ' };

      await customerController.searchArtistsAndProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Search query must be at least 2 characters long' });
    });

    it('should handle customer profile update with same username', async () => {
      const mockUser = { userId: 1, role: 'customer' };
      const mockCustomer = {
        customerId: 1,
        userId: 1,
        name: 'OldName',
        username: 'sameusername',
        phone: '123456789',
        address: 'Old Address',
        save: jest.fn().mockResolvedValue()
      };
      
      User.findOne.mockResolvedValue(mockUser);
      customer.findOne.mockResolvedValueOnce(mockCustomer);

      req.user = { id: 1 };
      req.body = {
        name: 'NewName',
        username: 'sameusername',
        phone: '987654321',
        address: 'New Address'
      };

      await customerController.updateProfile(req, res);

      expect(mockCustomer.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle empty artists and products in search results', async () => {
      req.query = { query: 'nonexistent' };
      req.user = { id: 1 };

      customer.findOne.mockResolvedValue({ customerId: 1, userId: 1 });
      Artist.findAll.mockResolvedValue([]);
      Product.findAll.mockResolvedValue([]);

      await customerController.searchArtistsAndProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        artists: [],
        products: [],
        totalResults: 0
      });
    });

    it('should handle missing user object in req', async () => {
      req.user = undefined;
      req.params = { artistId: '2' };
      await expect(async () => {
        await customerController.followArtist(req, res);
      }).not.toThrow();
    });
  });
});
