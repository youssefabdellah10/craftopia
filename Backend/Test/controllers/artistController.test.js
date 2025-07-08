jest.mock('../../src/models/artist', () => ({
  findOne: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  findOrCreate: jest.fn(),
  update: jest.fn(),
  count: jest.fn()
}));
jest.mock('../../src/models/user', () => ({
  findOne: jest.fn(),
  findByPk: jest.fn()
}));
jest.mock('../../src/models/product', () => ({
  findAll: jest.fn(),
  count: jest.fn()
}));
jest.mock('../../src/models/artistFollow', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn()
}));
jest.mock('../../src/models/customer', () => ({
  findOne: jest.fn()
}));
jest.mock('../../src/models/category', () => ({
  findAll: jest.fn()
}));
jest.mock('../../src/models/Review', () => ({
  count: jest.fn()
}));
jest.mock('../../src/utils/cloudinaryUpload', () => ({
  uploadBuffer: jest.fn()
}));
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));
jest.mock('../../src/config/db', () => ({}));
jest.mock('sequelize', () => {
  const actualSequelize = jest.requireActual('sequelize');
  return {
    ...actualSequelize,
    Op: {
      ne: Symbol('ne')
    },
    Sequelize: {
      fn: jest.fn(),
      col: jest.fn(),
      literal: jest.fn()
    }
  };
});

const artistController = require('../../src/controllers/artistController');
const Artist = require('../../src/models/artist');
const User = require('../../src/models/user');
const Product = require('../../src/models/product');
const ArtistFollow = require('../../src/models/artistFollow');
const Customer = require('../../src/models/customer');
const Category = require('../../src/models/category');
const Review = require('../../src/models/Review');
const { uploadBuffer } = require('../../src/utils/cloudinaryUpload');
const { validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');

describe('Artist Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      params: {},
      body: {},
      files: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  describe('updateArtist', () => {
    beforeEach(() => {
      req.body = {
        name: 'John Artist',
        username: 'johnartist',
        phone: '1234567890',
        biography: 'I am an artist'
      };
    });

    it('should return validation errors when present', async () => {
      const errors = [{ msg: 'Invalid data' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

      await artistController.updateArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors });
    });

    it('should return 400 when username already exists', async () => {
      const mockExistingArtist = { artistId: 2, username: 'johnartist' };
      Artist.findOne.mockResolvedValue(mockExistingArtist);

      await artistController.updateArtist(req, res);

      expect(Artist.findOne).toHaveBeenCalledWith({
        where: {
          username: 'johnartist',
          userId: { [Op.ne]: 1 }
        }
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Username already exists' });
    });

    it('should create new artist profile successfully', async () => {
      const mockArtist = {
        artistId: 1,
        name: 'John Artist',
        username: 'johnartist',
        phone: '1234567890',
        biography: 'I am an artist',
        userId: 1
      };

      Artist.findOne.mockResolvedValue(null);
      Artist.findOrCreate.mockResolvedValue([mockArtist, true]);

      await artistController.updateArtist(req, res);

      expect(Artist.findOrCreate).toHaveBeenCalledWith({
        where: { userId: 1 },
        defaults: {
          name: 'John Artist',
          username: 'johnartist',
          phone: '1234567890',
          biography: 'I am an artist',
          profilePicture: '',
          profileVideo: '',
          userId: 1
        }
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ artist: mockArtist });
    });

    it('should update existing artist profile successfully', async () => {
      const mockArtist = {
        artistId: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      Artist.findOne.mockResolvedValue(null);
      Artist.findOrCreate.mockResolvedValue([mockArtist, false]);

      await artistController.updateArtist(req, res);

      expect(mockArtist.update).toHaveBeenCalledWith({
        name: 'John Artist',
        username: 'johnartist',
        phone: '1234567890',
        biography: 'I am an artist'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ artist: mockArtist });
    });

    it('should handle file uploads for profile picture and video', async () => {
      req.files = {
        profilePicture: [{ buffer: Buffer.from('image data') }],
        profileVideo: [{ buffer: Buffer.from('video data') }]
      };

      const mockArtist = { artistId: 1 };
      Artist.findOne.mockResolvedValue(null);
      Artist.findOrCreate.mockResolvedValue([mockArtist, true]);
      uploadBuffer
        .mockResolvedValueOnce({ secure_url: 'https://cloudinary.com/image.jpg' })
        .mockResolvedValueOnce({ secure_url: 'https://cloudinary.com/video.mp4' });

      await artistController.updateArtist(req, res);

      expect(uploadBuffer).toHaveBeenCalledWith(
        Buffer.from('image data'),
        { folder: 'artists/1/profilePicture', resource_type: 'image' }
      );
      expect(uploadBuffer).toHaveBeenCalledWith(
        Buffer.from('video data'),
        { folder: 'artists/1/profileVideo', resource_type: 'video' }
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle internal server error', async () => {
      Artist.findOne.mockRejectedValue(new Error('Database error'));

      await artistController.updateArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getArtist', () => {
    beforeEach(() => {
      req.params = { artistId: '1' };
    });

    it('should return 404 when artist not found', async () => {
      Artist.findOne.mockResolvedValue(null);

      await artistController.getArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Artist profile not found' });
    });

    it('should return artist profile successfully', async () => {
      const mockArtist = {
        artistId: 1,
        name: 'John Artist',
        username: 'johnartist',
        products: [
          {
            categoryId: 1,
            category: { categoryId: 1, name: 'Paintings' }
          },
          {
            categoryId: 1,
            category: { categoryId: 1, name: 'Paintings' }
          }
        ],
        toJSON: () => ({
          artistId: 1,
          name: 'John Artist',
          username: 'johnartist'
        }),
        increment: jest.fn()
      };

      const mockUser = { userId: 1, role: 'customer' };

      Artist.findOne.mockResolvedValue(mockArtist);
      ArtistFollow.count.mockResolvedValue(5);
      Product.count.mockResolvedValue(10);
      User.findOne.mockResolvedValue(mockUser);

      await artistController.getArtist(req, res);

      expect(mockArtist.increment).toHaveBeenCalledWith('visitors');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        artist: {
          artistId: 1,
          name: 'John Artist',
          username: 'johnartist',
          numberOfFollowers: 5,
          numberOfProducts: 10,
          categories: [{ categoryId: 1, name: 'Paintings', productCount: 2 }]
        }
      });
    });

    it('should not increment visitors for non-customer users', async () => {
      const mockArtist = {
        artistId: 1,
        name: 'John Artist',
        products: [],
        toJSON: () => ({ artistId: 1, name: 'John Artist' }),
        increment: jest.fn()
      };

      const mockUser = { userId: 1, role: 'admin' };

      Artist.findOne.mockResolvedValue(mockArtist);
      ArtistFollow.count.mockResolvedValue(0);
      Product.count.mockResolvedValue(0);
      User.findOne.mockResolvedValue(mockUser);

      await artistController.getArtist(req, res);

      expect(mockArtist.increment).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle internal server error', async () => {
      Artist.findOne.mockRejectedValue(new Error('Database error'));

      await artistController.getArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getAllArtists', () => {
    it('should return validation errors when present', async () => {
      const errors = [{ msg: 'Invalid data' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

      await artistController.getAllArtists(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors });
    });

    it('should return all artists successfully for customer', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockArtists = [{
        artistId: 1,
        name: 'John Artist',
        username: 'johnartist',
        profilePicture: 'image.jpg',
        biography: 'Artist bio',
        createdAt: new Date(),
        averageRating: 4.5,
        dataValues: {
          numberOfProducts: 5,
          numberOfFollowers: 10,
          lowestPrice: 100
        },
        user: {
          userId: 2,
          email: 'john@example.com',
          isBanned: false
        }
      }];

      Customer.findOne.mockResolvedValue(mockCustomer);
      Artist.findAll.mockResolvedValue(mockArtists);
      ArtistFollow.findOne.mockResolvedValue(null);
      Product.findAll.mockResolvedValue([{
        categoryId: 1,
        category: { categoryId: 1, name: 'Paintings' }
      }]);
      Review.count.mockResolvedValue(3);

      await artistController.getAllArtists(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        artists: [{
          artistId: 1,
          name: 'John Artist',
          username: 'johnartist',
          profilePicture: 'image.jpg',
          biography: 'Artist bio',
          createdAt: mockArtists[0].createdAt,
          averageRating: 4.5,
          numberOfProducts: 5,
          numberOfFollowers: 10,
          lowestPrice: 100,
          email: 'john@example.com',
          userId: 2,
          banned: false,
          isFollowing: false,
          categories: ['Paintings'],
          totalReviews: 3
        }]
      });
    });

    it('should return all artists for non-customer user', async () => {
      req.user = undefined;
      const mockArtists = [{
        artistId: 1,
        name: 'John Artist',
        username: 'johnartist',
        profilePicture: 'image.jpg',
        biography: 'Artist bio',
        createdAt: new Date(),
        averageRating: 4.5,
        dataValues: {
          numberOfProducts: 5,
          numberOfFollowers: 10,
          lowestPrice: 100
        },
        user: {
          userId: 2,
          email: 'john@example.com',
          isBanned: false
        }
      }];

      Customer.findOne.mockResolvedValue(null);
      Artist.findAll.mockResolvedValue(mockArtists);
      Product.findAll.mockResolvedValue([]);
      Review.count.mockResolvedValue(0);

      await artistController.getAllArtists(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        artists: [{
          artistId: 1,
          name: 'John Artist',
          username: 'johnartist',
          profilePicture: 'image.jpg',
          biography: 'Artist bio',
          createdAt: mockArtists[0].createdAt,
          averageRating: 4.5,
          numberOfProducts: 5,
          numberOfFollowers: 10,
          lowestPrice: 100,
          email: 'john@example.com',
          userId: 2,
          banned: false,
          isFollowing: false,
          categories: [],
          totalReviews: 0
        }]
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await artistController.getAllArtists(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getArtistFollowers', () => {
    beforeEach(() => {
      req.params = { artistId: '1' };
    });

    it('should return 404 when artist not found', async () => {
      Artist.findByPk.mockResolvedValue(null);

      await artistController.getArtistFollowers(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Artist not found' });
    });

    it('should return artist followers successfully', async () => {
      const mockArtist = { artistId: 1 };
      const mockFollowers = [
        {
          customer: {
            customerId: 1,
            name: 'Customer 1',
            username: 'customer1'
          }
        },
        {
          customer: {
            customerId: 2,
            name: 'Customer 2',
            username: 'customer2'
          }
        }
      ];

      Artist.findByPk.mockResolvedValue(mockArtist);
      ArtistFollow.count.mockResolvedValue(2);
      ArtistFollow.findAll.mockResolvedValue(mockFollowers);

      await artistController.getArtistFollowers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        followersCount: 2,
        followers: [
          { customerId: 1, name: 'Customer 1', username: 'customer1' },
          { customerId: 2, name: 'Customer 2', username: 'customer2' }
        ]
      });
    });

    it('should handle internal server error', async () => {
      Artist.findByPk.mockRejectedValue(new Error('Database error'));

      await artistController.getArtistFollowers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getProfile', () => {
    it('should return artist profile successfully', async () => {
      const mockArtist = {
        artistId: 1,
        name: 'John Artist',
        username: 'johnartist',
        userId: 1
      };

      Artist.findOne.mockResolvedValue(mockArtist);

      await artistController.getProfile(req, res);

      expect(Artist.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ArtistProfile: mockArtist });
    });

    it('should return 404 when artist profile not found', async () => {
      Artist.findOne.mockResolvedValue(null);

      await artistController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Artist profile not found" });
    });

    it('should handle internal server error', async () => {
      Artist.findOne.mockRejectedValue(new Error('Database error'));

      await artistController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
  });

  describe('getArtistByName', () => {
    beforeEach(() => {
      req.params = { name: 'John Artist' };
    });

    it('should return 400 when name is missing', async () => {
      req.params = {};

      await artistController.getArtistByName(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Artist name is required" });
    });

    it('should return 404 when artist not found', async () => {
      Artist.findOne.mockResolvedValue(null);

      await artistController.getArtistByName(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Artist not found" });
    });

    it('should return artist by name successfully', async () => {
      const mockArtist = {
        artistId: 1,
        name: 'John Artist',
        username: 'johnartist',
        products: [
          {
            category: { categoryId: 1, name: 'Paintings' }
          },
          {
            category: { categoryId: 2, name: 'Sculptures' }
          }
        ],
        toJSON: () => ({
          artistId: 1,
          name: 'John Artist',
          username: 'johnartist'
        })
      };

      Artist.findOne.mockResolvedValue(mockArtist);
      ArtistFollow.count.mockResolvedValue(15);
      Product.count.mockResolvedValue(8);

      await artistController.getArtistByName(req, res);

      expect(Artist.findOne).toHaveBeenCalledWith({
        where: { name: 'John Artist' },
        include: expect.any(Array)
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        artist: {
          artistId: 1,
          name: 'John Artist',
          username: 'johnartist',
          numberOfFollowers: 15,
          numberOfProducts: 8,
          categories: [
            { categoryId: 1, name: 'Paintings', productCount: 1 },
            { categoryId: 2, name: 'Sculptures', productCount: 1 }
          ]
        }
      });
    });

    it('should handle products without categories', async () => {
      const mockArtist = {
        artistId: 1,
        name: 'John Artist',
        products: [
          { category: null },
          { category: { categoryId: 1, name: 'Paintings' } }
        ],
        toJSON: () => ({ artistId: 1, name: 'John Artist' })
      };

      Artist.findOne.mockResolvedValue(mockArtist);
      ArtistFollow.count.mockResolvedValue(0);
      Product.count.mockResolvedValue(2);

      await artistController.getArtistByName(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        artist: {
          artistId: 1,
          name: 'John Artist',
          numberOfFollowers: 0,
          numberOfProducts: 2,
          categories: [
            { categoryId: 1, name: 'Paintings', productCount: 1 }
          ]
        }
      });
    });

    it('should handle internal server error', async () => {
      Artist.findOne.mockRejectedValue(new Error('Database error'));

      await artistController.getArtistByName(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
  });
});
