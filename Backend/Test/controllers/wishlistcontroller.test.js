jest.mock('../../src/models/customer');
jest.mock('../../src/models/wishlist');
jest.mock('../../src/models/product');
jest.mock('../../src/models/artist');
jest.mock('../../src/models/category');

const wishlistController = require('../../src/controllers/wishlistcontroller');
const Customer = require('../../src/models/customer');
const Wishlist = require('../../src/models/wishlist');
const Product = require('../../src/models/product');
const Artist = require('../../src/models/artist');
const Category = require('../../src/models/category');

describe('Wishlist Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 1, role: 'customer' },
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('addtoWishlist', () => {
    beforeEach(() => {
      req.params = { productId: '1' };
    });

    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await wishlistController.addtoWishlist(req, res);

      expect(Customer.findOne).toHaveBeenCalledWith({
        where: { userId: 1 }
      });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Customer not found'
      });
    });

    it('should return 404 when product not found', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(null);

      await wishlistController.addtoWishlist(req, res);

      expect(Product.findByPk).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Product not found'
      });
    });

    it('should return 400 when product already in wishlist', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockProduct = { productId: 1, name: 'Test Product' };
      const mockExistingWishlistItem = { wishlistId: 1, customerId: 1, productId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Wishlist.findOne.mockResolvedValue(mockExistingWishlistItem);

      await wishlistController.addtoWishlist(req, res);

      expect(Wishlist.findOne).toHaveBeenCalledWith({
        where: {
          customerId: 1,
          productId: '1'
        }
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Product already in wishlist'
      });
    });

    it('should add product to wishlist successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockProduct = { productId: 1, name: 'Test Product' };
      const mockWishlistItem = { wishlistId: 1, customerId: 1, productId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Wishlist.findOne.mockResolvedValue(null);
      Wishlist.create.mockResolvedValue(mockWishlistItem);

      await wishlistController.addtoWishlist(req, res);

      expect(Wishlist.create).toHaveBeenCalledWith({
        customerId: 1,
        productId: '1'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Product added to wishlist successfully',
        wishlistItem: mockWishlistItem
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await wishlistController.addtoWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });
    });

    it('should handle case with different productId types', async () => {
      req.params = { productId: 123 };
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockProduct = { productId: 123, name: 'Test Product' };
      const mockWishlistItem = { wishlistId: 1, customerId: 1, productId: 123 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Wishlist.findOne.mockResolvedValue(null);
      Wishlist.create.mockResolvedValue(mockWishlistItem);

      await wishlistController.addtoWishlist(req, res);

      expect(Wishlist.create).toHaveBeenCalledWith({
        customerId: 1,
        productId: 123
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getWishlist', () => {
    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await wishlistController.getWishlist(req, res);

      expect(Customer.findOne).toHaveBeenCalledWith({
        where: { userId: 1 }
      });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Customer not found'
      });
    });

    it('should return wishlist successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockWishlistItems = [
        {
          wishlistId: 1,
          customerId: 1,
          productId: 1,
          product: {
            productId: 1,
            name: 'Product 1',
            price: 100.00,
            category: {
              name: 'Electronics'
            },
            artist: {
              name: 'John Artist',
              username: 'john_artist'
            }
          }
        },
        {
          wishlistId: 2,
          customerId: 1,
          productId: 2,
          product: {
            productId: 2,
            name: 'Product 2',
            price: 150.00,
            category: {
              name: 'Art'
            },
            artist: {
              name: 'Jane Artist',
              username: 'jane_artist'
            }
          }
        }
      ];

      Customer.findOne.mockResolvedValue(mockCustomer);
      Wishlist.findAll.mockResolvedValue(mockWishlistItems);

      await wishlistController.getWishlist(req, res);

      expect(Wishlist.findAll).toHaveBeenCalledWith({
        where: { customerId: 1 },
        include: [{
          model: Product,
          as: 'product',
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['name']
            },
            {
              model: Artist,
              as: 'artist',
              attributes: ['name', 'username']
            }
          ]
        }]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Wishlist retrieved successfully',
        wishlistItems: mockWishlistItems
      });
    });

    it('should return empty wishlist successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Wishlist.findAll.mockResolvedValue([]);

      await wishlistController.getWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Wishlist retrieved successfully',
        wishlistItems: []
      });
    });

    it('should handle wishlist with null product associations', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockWishlistItems = [
        {
          wishlistId: 1,
          customerId: 1,
          productId: 1,
          product: null
        }
      ];

      Customer.findOne.mockResolvedValue(mockCustomer);
      Wishlist.findAll.mockResolvedValue(mockWishlistItems);

      await wishlistController.getWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Wishlist retrieved successfully',
        wishlistItems: mockWishlistItems
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database connection failed'));

      await wishlistController.getWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });
    });
  });

  describe('removeFromWishlist', () => {
    beforeEach(() => {
      req.params = { productId: '1' };
    });

    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await wishlistController.removeFromWishlist(req, res);

      expect(Customer.findOne).toHaveBeenCalledWith({
        where: { userId: 1 }
      });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Customer not found'
      });
    });

    it('should return 404 when wishlist item not found', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Wishlist.findOne.mockResolvedValue(null);

      await wishlistController.removeFromWishlist(req, res);

      expect(Wishlist.findOne).toHaveBeenCalledWith({
        where: {
          customerId: 1,
          productId: '1'
        }
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Wishlist item not found'
      });
    });

    it('should remove product from wishlist successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockWishlistItem = {
        wishlistId: 1,
        customerId: 1,
        productId: 1,
        destroy: jest.fn().mockResolvedValue()
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Wishlist.findOne.mockResolvedValue(mockWishlistItem);

      await wishlistController.removeFromWishlist(req, res);

      expect(mockWishlistItem.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Product removed from wishlist successfully'
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await wishlistController.removeFromWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });
    });

    it('should handle destroy method error', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockWishlistItem = {
        wishlistId: 1,
        customerId: 1,
        productId: 1,
        destroy: jest.fn().mockRejectedValue(new Error('Destroy failed'))
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Wishlist.findOne.mockResolvedValue(mockWishlistItem);

      await wishlistController.removeFromWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });
    });

    it('should handle different productId formats', async () => {
      req.params = { productId: 123 };
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockWishlistItem = {
        wishlistId: 1,
        customerId: 1,
        productId: 123,
        destroy: jest.fn().mockResolvedValue()
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Wishlist.findOne.mockResolvedValue(mockWishlistItem);

      await wishlistController.removeFromWishlist(req, res);

      expect(Wishlist.findOne).toHaveBeenCalledWith({
        where: {
          customerId: 1,
          productId: 123
        }
      });
      expect(mockWishlistItem.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
