jest.mock('../../src/models/Review');
jest.mock('../../src/models/product');
jest.mock('../../src/models/customer');
jest.mock('../../src/models/order');
jest.mock('../../src/models/artist');
jest.mock('../../src/models/Product_Order');
jest.mock('../../src/models/rating');
jest.mock('../../src/models/index');
jest.mock('express-validator');

jest.mock('../../src/utils/ratingUtils', () => ({
  updateArtistRating: jest.fn()
}));

const reviewController = require('../../src/controllers/reviewController');
const Review = require('../../src/models/Review');
const Product = require('../../src/models/product');
const Customer = require('../../src/models/customer');
const Order = require('../../src/models/order');
const Artist = require('../../src/models/artist');
const Product_Order = require('../../src/models/Product_Order');
const Rating = require('../../src/models/rating');
const { validationResult } = require('express-validator');
const { updateArtistRating } = require('../../src/utils/ratingUtils');

describe('Review Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 1, role: 'customer' },
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    validationResult.mockReturnValue({ isEmpty: () => true });
  });

  describe('createReview', () => {
    beforeEach(() => {
      req.body = {
        productId: 1,
        rating: 5,
        review: 'Great product!',
        artistRating: 4,
        artistComment: 'Nice artist'
      };
    });

    it('should return validation errors when present', async () => {
      const errors = [{ field: 'rating', msg: 'Rating is required' }];
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      await reviewController.createReview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation errors',
        errors: errors
      });
    });

    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await reviewController.createReview(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Only customers can create reviews'
      });
    });

    it('should return 404 when product not found', async () => {
      const mockCustomer = { customerId: 1 };
      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(null);

      await reviewController.createReview(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Product not found'
      });
    });

    it('should return 400 when customer has already reviewed product', async () => {
      const mockCustomer = { customerId: 1 };
      const mockProduct = { productId: 1, artistId: 1 };
      const mockExistingReview = { reviewId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Review.findOne.mockResolvedValue(mockExistingReview);

      await reviewController.createReview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You have already reviewed this product'
      });
    });

    it('should return 403 when customer has not purchased the product', async () => {
      const mockCustomer = { customerId: 1 };
      const mockProduct = { productId: 1, artistId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Review.findOne.mockResolvedValue(null);
      Order.findOne.mockResolvedValue(null);

      await reviewController.createReview(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You can only review products you have purchased and received'
      });
    });

    it('should create review successfully without artist rating', async () => {
      const mockCustomer = { customerId: 1 };
      const mockProduct = { productId: 1, artistId: 1 };
      const mockOrder = { orderId: 1 };
      const mockNewReview = { reviewId: 1 };

      req.body.artistRating = undefined;

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Review.findOne.mockResolvedValue(null);
      Order.findOne.mockResolvedValue(mockOrder);
      Review.create.mockResolvedValue(mockNewReview);

      await reviewController.createReview(req, res);

      expect(Review.create).toHaveBeenCalledWith({
        customerId: 1,
        productId: 1,
        rating: 5,
        review: 'Great product!'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Review created successfully',
        review: mockNewReview
      });
    });

    it('should create review and artist rating successfully', async () => {
      const mockCustomer = { customerId: 1 };
      const mockProduct = { productId: 1, artistId: 1 };
      const mockOrder = { orderId: 1 };
      const mockNewReview = { reviewId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Review.findOne.mockResolvedValue(null);
      Order.findOne.mockResolvedValue(mockOrder);
      Review.create.mockResolvedValue(mockNewReview);
      Rating.findOne.mockResolvedValue(null);
      Rating.create.mockResolvedValue({ ratingId: 1 });
      updateArtistRating.mockResolvedValue();

      await reviewController.createReview(req, res);

      expect(Rating.create).toHaveBeenCalledWith({
        customerId: 1,
        artistId: 1,
        rating: 4,
        comment: 'Nice artist'
      });
      expect(updateArtistRating).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when customer has already rated the artist', async () => {
      const mockCustomer = { customerId: 1 };
      const mockProduct = { productId: 1, artistId: 1 };
      const mockOrder = { orderId: 1 };
      const mockExistingRating = { ratingId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Review.findOne.mockResolvedValue(null);
      Order.findOne.mockResolvedValue(mockOrder);
      Rating.findOne.mockResolvedValue(mockExistingRating);

      await reviewController.createReview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You have already rated this artist'
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await reviewController.createReview(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database error'
      });
    });
  });

  describe('getProductReviews', () => {
    beforeEach(() => {
      req.params = { productId: '1' };
    });

    it('should return 404 when product not found', async () => {
      Product.findByPk.mockResolvedValue(null);

      await reviewController.getProductReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Product not found'
      });
    });

    it('should return product reviews successfully', async () => {
      const mockProduct = { productId: 1 };
      const mockReviews = [
        { rating: 5, customer: { name: 'John', username: 'john123' } },
        { rating: 4, customer: { name: 'Jane', username: 'jane456' } }
      ];

      Product.findByPk.mockResolvedValue(mockProduct);
      Review.findAll.mockResolvedValue(mockReviews);

      await reviewController.getProductReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Reviews retrieved successfully',
        reviews: mockReviews,
        averageRating: 4.5,
        totalReviews: 2
      });
    });

    it('should handle empty reviews array', async () => {
      const mockProduct = { productId: 1 };

      Product.findByPk.mockResolvedValue(mockProduct);
      Review.findAll.mockResolvedValue([]);

      await reviewController.getProductReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Reviews retrieved successfully',
        reviews: [],
        averageRating: 0,
        totalReviews: 0
      });
    });

    it('should handle internal server error', async () => {
      Product.findByPk.mockRejectedValue(new Error('Database error'));

      await reviewController.getProductReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database error'
      });
    });
  });

  describe('updateReview', () => {
    beforeEach(() => {
      req.params = { productId: '1' };
      req.body = { rating: 4, review: 'Updated review' };
    });

    it('should return validation errors when present', async () => {
      const errors = [{ field: 'rating', msg: 'Rating is required' }];
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      await reviewController.updateReview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation errors',
        errors: errors
      });
    });

    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await reviewController.updateReview(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Only customers can update reviews'
      });
    });

    it('should return 404 when review not found', async () => {
      const mockCustomer = { customerId: 1 };
      Customer.findOne.mockResolvedValue(mockCustomer);
      Review.findOne.mockResolvedValue(null);

      await reviewController.updateReview(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Review not found'
      });
    });

    it('should update review successfully', async () => {
      const mockCustomer = { customerId: 1 };
      const mockReview = {
        update: jest.fn().mockResolvedValue(),
        reviewId: 1
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Review.findOne.mockResolvedValue(mockReview);

      await reviewController.updateReview(req, res);

      expect(mockReview.update).toHaveBeenCalledWith({
        rating: 4,
        review: 'Updated review'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Review updated successfully',
        review: mockReview
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await reviewController.updateReview(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database error'
      });
    });
  });

  describe('deleteReview', () => {
    beforeEach(() => {
      req.params = { productId: '1' };
    });

    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await reviewController.deleteReview(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Only customers can delete reviews'
      });
    });

    it('should return 404 when review not found', async () => {
      const mockCustomer = { customerId: 1 };
      Customer.findOne.mockResolvedValue(mockCustomer);
      Review.findOne.mockResolvedValue(null);

      await reviewController.deleteReview(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Review not found'
      });
    });

    it('should delete review successfully', async () => {
      const mockCustomer = { customerId: 1 };
      const mockReview = {
        destroy: jest.fn().mockResolvedValue(),
        reviewId: 1
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Review.findOne.mockResolvedValue(mockReview);

      await reviewController.deleteReview(req, res);

      expect(mockReview.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Review deleted successfully'
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await reviewController.deleteReview(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database error'
      });
    });
  });

  describe('getCustomerReviews', () => {
    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await reviewController.getCustomerReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Only customers can view their reviews'
      });
    });

    it('should return customer reviews successfully', async () => {
      const mockCustomer = { customerId: 1 };
      const mockReviews = [
        { reviewId: 1, rating: 5, product: { name: 'Product 1', image: 'image1.jpg' } },
        { reviewId: 2, rating: 4, product: { name: 'Product 2', image: 'image2.jpg' } }
      ];

      Customer.findOne.mockResolvedValue(mockCustomer);
      Review.findAll.mockResolvedValue(mockReviews);

      await reviewController.getCustomerReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Customer reviews retrieved successfully',
        reviews: mockReviews
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await reviewController.getCustomerReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database error'
      });
    });
  });

  describe('getArtistProductsReviews', () => {
    beforeEach(() => {
      req.params = { artistId: '1' };
    });

    it('should return validation errors when present', async () => {
      const errors = [{ field: 'artistId', msg: 'Artist ID is required' }];
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      await reviewController.getArtistProductsReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation errors',
        errors: errors
      });
    });

    it('should return 404 when artist not found', async () => {
      Artist.findByPk.mockResolvedValue(null);

      await reviewController.getArtistProductsReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Artist not found'
      });
    });

    it('should return 404 when no products found for artist', async () => {
      const mockArtist = { artistId: 1 };
      Artist.findByPk.mockResolvedValue(mockArtist);
      Product.findAll.mockResolvedValue([]);

      await reviewController.getArtistProductsReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No products found for this artist'
      });
    });

    it('should return artist products reviews successfully', async () => {
      const mockArtist = { artistId: 1 };
      const mockProducts = [
        {
          productId: 1,
          name: 'Product 1',
          reviews: [
            {
              reviewId: 1,
              rating: 5,
              review: 'Great!',
              customer: { name: 'John', username: 'john123' },
              createdAt: new Date()
            }
          ]
        },
        {
          productId: 2,
          name: 'Product 2',
          reviews: []
        }
      ];

      Artist.findByPk.mockResolvedValue(mockArtist);
      Product.findAll.mockResolvedValue(mockProducts);

      await reviewController.getArtistProductsReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Artist products reviews retrieved successfully',
        productReviews: expect.arrayContaining([
          expect.objectContaining({
            productId: 1,
            productName: 'Product 1',
            reviews: expect.arrayContaining([
              expect.objectContaining({
                reviewId: 1,
                rating: 5,
                review: 'Great!',
                customerName: 'John',
                customerUsername: 'john123'
              })
            ])
          }),
          expect.objectContaining({
            productId: 2,
            productName: 'Product 2',
            reviews: []
          })
        ])
      });
    });

    it('should handle products with null reviews', async () => {
      const mockArtist = { artistId: 1 };
      const mockProducts = [
        {
          productId: 1,
          name: 'Product 1',
          reviews: null
        }
      ];

      Artist.findByPk.mockResolvedValue(mockArtist);
      Product.findAll.mockResolvedValue(mockProducts);

      await reviewController.getArtistProductsReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Artist products reviews retrieved successfully',
        productReviews: [
          {
            productId: 1,
            productName: 'Product 1',
            reviews: []
          }
        ]
      });
    });

    it('should handle internal server error', async () => {
      Artist.findByPk.mockRejectedValue(new Error('Database error'));

      await reviewController.getArtistProductsReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database error'
      });
    });
  });
});
