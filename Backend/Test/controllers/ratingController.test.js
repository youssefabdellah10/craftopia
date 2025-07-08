jest.mock('../../src/models', () => ({
  Rating: {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  Artist: {
    findByPk: jest.fn()
  },
  Customer: {
    findOne: jest.fn()
  }
}));

jest.mock('../../src/utils/ratingUtils', () => ({
  updateArtistRating: jest.fn()
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const { Rating, Artist, Customer } = require('../../src/models');
const { updateArtistRating } = require('../../src/utils/ratingUtils');
const { validationResult } = require('express-validator');
const ratingController = require('../../src/controllers/ratingController');

describe('Rating Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    validationResult.mockReturnValue({ isEmpty: () => true });
    updateArtistRating.mockResolvedValue();
  });

  describe('addRating', () => {
    beforeEach(() => {
      req.body = { artistId: 1, rating: 5, comment: 'Great work!' };
      req.user = { id: 1 };
    });

    it('should return validation errors when present', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'rating', message: 'Rating is required' }]
      });

      await ratingController.addRating(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation errors',
        errors: [{ field: 'rating', message: 'Rating is required' }]
      });
    });

    it('should return 404 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await ratingController.addRating(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Customer not found'
      });
    });

    it('should create new rating when no existing rating found', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockRating = {
        ratingId: 1,
        customerId: 1,
        artistId: 1,
        rating: 5,
        comment: 'Great work!'
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Rating.findOne.mockResolvedValue(null);
      Rating.create.mockResolvedValue(mockRating);

      await ratingController.addRating(req, res);

      expect(Rating.create).toHaveBeenCalledWith({
        customerId: 1,
        artistId: 1,
        rating: 5,
        comment: 'Great work!'
      });
      expect(updateArtistRating).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Rating added successfully',
        rating: mockRating
      });
    });

    it('should update existing rating when found', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockExistingRating = {
        ratingId: 1,
        customerId: 1,
        artistId: 1,
        rating: 3,
        comment: 'Good work',
        update: jest.fn().mockResolvedValue()
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Rating.findOne.mockResolvedValue(mockExistingRating);

      await ratingController.addRating(req, res);

      expect(mockExistingRating.update).toHaveBeenCalledWith({
        rating: 5,
        comment: 'Great work!'
      });
      expect(updateArtistRating).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Rating updated successfully',
        rating: mockExistingRating
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await ratingController.addRating(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error adding/updating rating:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('getArtistRatings', () => {
    beforeEach(() => {
      req.params = { artistId: '1' };
    });

    it('should return validation errors when present', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'artistId', message: 'Artist ID is required' }]
      });

      await ratingController.getArtistRatings(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation errors',
        errors: [{ field: 'artistId', message: 'Artist ID is required' }]
      });
    });

    it('should return 404 when artist not found', async () => {
      Artist.findByPk.mockResolvedValue(null);

      await ratingController.getArtistRatings(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Artist not found'
      });
    });

    it('should return artist ratings successfully', async () => {
      const mockArtist = {
        artistId: 1,
        name: 'John Artist',
        username: 'johnartist',
        profilePicture: 'profile.jpg',
        averageRating: 4.5,
        totalRatings: 10
      };

      const mockRatings = {
        rows: [
          {
            ratingId: 1,
            rating: 5,
            comment: 'Excellent work!',
            Customer: { name: 'Jane Customer', username: 'janecustomer' }
          },
          {
            ratingId: 2,
            rating: 4,
            comment: 'Good job',
            Customer: { name: 'Bob Customer', username: 'bobcustomer' }
          }
        ],
        count: 2
      };

      Artist.findByPk.mockResolvedValue(mockArtist);
      Rating.findAndCountAll.mockResolvedValue(mockRatings);

      await ratingController.getArtistRatings(req, res);

      expect(Artist.findByPk).toHaveBeenCalledWith('1', {
        attributes: ['artistId', 'name', 'username', 'profilePicture', 'averageRating', 'totalRatings']
      });
      expect(Rating.findAndCountAll).toHaveBeenCalledWith({
        where: { artistId: '1' },
        include: [{
          model: Customer,
          attributes: ['name', 'username']
        }],
        order: [['createdAt', 'DESC']]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        artist: {
          artistId: 1,
          name: 'John Artist',
          username: 'johnartist',
          profilePicture: 'profile.jpg',
          averageRating: 4.5,
          totalRatings: 10
        },
        ratings: mockRatings.rows,
        totalRatings: 2
      });
    });

    it('should handle null averageRating gracefully', async () => {
      const mockArtist = {
        artistId: 1,
        name: 'John Artist',
        username: 'johnartist',
        profilePicture: 'profile.jpg',
        averageRating: null,
        totalRatings: 0
      };

      const mockRatings = { rows: [], count: 0 };

      Artist.findByPk.mockResolvedValue(mockArtist);
      Rating.findAndCountAll.mockResolvedValue(mockRatings);

      await ratingController.getArtistRatings(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        artist: {
          artistId: 1,
          name: 'John Artist',
          username: 'johnartist',
          profilePicture: 'profile.jpg',
          averageRating: 0.00,
          totalRatings: 0
        },
        ratings: [],
        totalRatings: 0
      });
    });

    it('should handle undefined totalRatings gracefully', async () => {
      const mockArtist = {
        artistId: 1,
        name: 'John Artist',
        username: 'johnartist',
        profilePicture: 'profile.jpg',
        averageRating: 3.75,
        totalRatings: undefined
      };

      const mockRatings = { rows: [], count: 0 };

      Artist.findByPk.mockResolvedValue(mockArtist);
      Rating.findAndCountAll.mockResolvedValue(mockRatings);

      await ratingController.getArtistRatings(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        artist: expect.objectContaining({
          averageRating: 3.75,
          totalRatings: 0
        }),
        ratings: [],
        totalRatings: 0
      });
    });

    it('should handle internal server error', async () => {
      Artist.findByPk.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await ratingController.getArtistRatings(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching artist ratings:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('getCustomerRating', () => {
    beforeEach(() => {
      req.params = { artistId: '1' };
      req.user = { id: 1 };
    });

    it('should return validation errors when present', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'artistId', message: 'Artist ID is required' }]
      });

      await ratingController.getCustomerRating(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation errors',
        errors: [{ field: 'artistId', message: 'Artist ID is required' }]
      });
    });

    it('should return 404 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await ratingController.getCustomerRating(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Customer not found'
      });
    });

    it('should return 404 when no rating found', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Rating.findOne.mockResolvedValue(null);

      await ratingController.getCustomerRating(req, res);

      expect(Rating.findOne).toHaveBeenCalledWith({
        where: { customerId: 1, artistId: '1' }
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No rating found'
      });
    });

    it('should return customer rating successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockRating = {
        ratingId: 1,
        customerId: 1,
        artistId: 1,
        rating: 4,
        comment: 'Good work!'
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Rating.findOne.mockResolvedValue(mockRating);

      await ratingController.getCustomerRating(req, res);

      expect(Customer.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(Rating.findOne).toHaveBeenCalledWith({
        where: { customerId: 1, artistId: '1' }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        rating: mockRating
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await ratingController.getCustomerRating(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching customer rating:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });

      consoleSpy.mockRestore();
    });
  });
});
