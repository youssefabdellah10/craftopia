jest.mock('../../src/models/customer', () => ({
  findOne: jest.fn()
}));
jest.mock('../../src/models/cart', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn()
}));
jest.mock('../../src/models/product', () => ({
  findByPk: jest.fn()
}));
jest.mock('../../src/models/artist', () => ({}));
jest.mock('../../src/models/category', () => ({}));

const cartController = require('../../src/controllers/cartController');
const Customer = require('../../src/models/customer');
const Cart = require('../../src/models/cart');
const Product = require('../../src/models/product');

describe('Cart Controller', () => {
  let req, res;

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
    jest.clearAllMocks();
  });

  describe('addToCart', () => {
    it('should return 403 when customer not found', async () => {
      req.params = { productId: '1' };
      req.body = { quantity: 2 };

      Customer.findOne.mockResolvedValue(null);

      await cartController.addToCart(req, res);

      expect(Customer.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
    });

    it('should return 404 when product not found', async () => {
      req.params = { productId: '999' };
      req.body = { quantity: 2 };

      const mockCustomer = { customerId: 1 };
      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(null);

      await cartController.addToCart(req, res);

      expect(Product.findByPk).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
    });

    it('should return 400 when requested quantity exceeds available stock', async () => {
      req.params = { productId: '1' };
      req.body = { quantity: 15 };

      const mockCustomer = { customerId: 1 };
      const mockProduct = {
        productId: 1,
        quantity: 10,
        sellingNumber: 5
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(null);

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Only 10 item(s) available. You already have 0 in cart.'
      });
    });

    it('should return 400 when adding to existing cart item exceeds available stock', async () => {
      req.params = { productId: '1' };
      req.body = { quantity: 9 };

      const mockCustomer = { customerId: 1 };
      const mockProduct = {
        productId: 1,
        quantity: 10,
        sellingNumber: 7
      };
      const mockExistingCartItem = {
        quantity: 2,
        customerId: 1,
        productId: 1
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(mockExistingCartItem);

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Only 10 item(s) available. You already have 2 in cart.'
      });
    });

    it('should update existing cart item quantity successfully', async () => {
      req.params = { productId: '1' };
      req.body = { quantity: 2 };

      const mockCustomer = { customerId: 1 };
      const mockProduct = {
        productId: 1,
        quantity: 10,
        sellingNumber: 5
      };
      const mockExistingCartItem = {
        quantity: 1,
        customerId: 1,
        productId: 1,
        save: jest.fn().mockResolvedValue()
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(mockExistingCartItem);

      await cartController.addToCart(req, res);

      expect(mockExistingCartItem.quantity).toBe(3);
      expect(mockExistingCartItem.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Product quantity updated in cart successfully',
        cartItem: mockExistingCartItem
      });
    });

    it('should create new cart item successfully', async () => {
      req.params = { productId: '1' };
      req.body = { quantity: 2 };

      const mockCustomer = { customerId: 1 };
      const mockProduct = {
        productId: 1,
        quantity: 10,
        sellingNumber: 3
      };
      const mockNewCartItem = {
        customerId: 1,
        productId: 1,
        quantity: 2
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(null);
      Cart.create.mockResolvedValue(mockNewCartItem);

      await cartController.addToCart(req, res);

      expect(Cart.create).toHaveBeenCalledWith({
        customerId: 1,
        productId: '1',
        quantity: 2
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Product added to cart successfully',
        cartItem: mockNewCartItem
      });
    });

    it('should use default quantity of 1 when not provided', async () => {
      req.params = { productId: '1' };
      req.body = {};

      const mockCustomer = { customerId: 1 };
      const mockProduct = {
        productId: 1,
        quantity: 10,
        sellingNumber: 3
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Product.findByPk.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(null);
      Cart.create.mockResolvedValue({});

      await cartController.addToCart(req, res);

      expect(Cart.create).toHaveBeenCalledWith({
        customerId: 1,
        productId: '1',
        quantity: 1
      });
    });

    it('should handle internal server error', async () => {
      req.params = { productId: '1' };
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await cartController.addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getCart', () => {
    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await cartController.getCart(req, res);

      expect(Customer.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
    });

    it('should return cart items successfully', async () => {
      const mockCustomer = { customerId: 1 };
      const mockCartItems = [
        {
          customerId: 1,
          productId: 1,
          quantity: 2,
          Product: {
            productId: 1,
            name: 'Test Product',
            price: 29.99,
            Category: { name: 'Electronics' },
            Artist: { name: 'John Doe', username: 'johndoe' }
          }
        },
        {
          customerId: 1,
          productId: 2,
          quantity: 1,
          Product: {
            productId: 2,
            name: 'Another Product',
            price: 19.99,
            Category: { name: 'Books' },
            Artist: { name: 'Jane Smith', username: 'janesmith' }
          }
        }
      ];

      Customer.findOne.mockResolvedValue(mockCustomer);
      Cart.findAll.mockResolvedValue(mockCartItems);

      await cartController.getCart(req, res);

      expect(Cart.findAll).toHaveBeenCalledWith({
        where: { customerId: 1 },
        include: [
          {
            model: Product,
            include: [
              { model: expect.anything(), attributes: ['name'] },
              { model: expect.anything(), attributes: ['name', 'username'] }
            ]
          }
        ]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cart retrieved successfully',
        cartItems: mockCartItems
      });
    });

    it('should handle empty cart', async () => {
      const mockCustomer = { customerId: 1 };
      Customer.findOne.mockResolvedValue(mockCustomer);
      Cart.findAll.mockResolvedValue([]);

      await cartController.getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cart retrieved successfully',
        cartItems: []
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await cartController.getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('removeFromCart', () => {
    it('should return 403 when customer not found', async () => {
      req.params = { productId: '1' };
      Customer.findOne.mockResolvedValue(null);

      await cartController.removeFromCart(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
    });

    it('should return 404 when cart item not found', async () => {
      req.params = { productId: '999' };
      const mockCustomer = { customerId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Cart.findOne.mockResolvedValue(null);

      await cartController.removeFromCart(req, res);

      expect(Cart.findOne).toHaveBeenCalledWith({
        where: {
          customerId: 1,
          productId: '999'
        }
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cart item not found' });
    });

    it('should remove cart item successfully', async () => {
      req.params = { productId: '1' };
      const mockCustomer = { customerId: 1 };
      const mockCartItem = {
        customerId: 1,
        productId: 1,
        quantity: 2,
        destroy: jest.fn().mockResolvedValue()
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Cart.findOne.mockResolvedValue(mockCartItem);

      await cartController.removeFromCart(req, res);

      expect(mockCartItem.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Product removed from cart successfully' });
    });

    it('should handle internal server error', async () => {
      req.params = { productId: '1' };
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await cartController.removeFromCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('clearCart', () => {
    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await cartController.clearCart(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
    });

    it('should return 404 when cart is already empty', async () => {
      const mockCustomer = { customerId: 1 };
      Customer.findOne.mockResolvedValue(mockCustomer);
      Cart.destroy.mockResolvedValue(0);

      await cartController.clearCart(req, res);

      expect(Cart.destroy).toHaveBeenCalledWith({
        where: { customerId: 1 }
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cart is already empty' });
    });

    it('should clear cart successfully', async () => {
      const mockCustomer = { customerId: 1 };
      Customer.findOne.mockResolvedValue(mockCustomer);
      Cart.destroy.mockResolvedValue(3);

      await cartController.clearCart(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cart cleared successfully',
        deletedItems: 3
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await cartController.clearCart(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('incrementCartItem', () => {
    it('should return 403 when customer not found', async () => {
      req.params = { productId: '1' };
      Customer.findOne.mockResolvedValue(null);

      await cartController.incrementCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
    });

    it('should return 404 when cart item not found', async () => {
      req.params = { productId: '999' };
      const mockCustomer = { customerId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Cart.findOne.mockResolvedValue(null);

      await cartController.incrementCartItem(req, res);

      expect(Cart.findOne).toHaveBeenCalledWith({
        where: {
          customerId: 1,
          productId: '999'
        },
        include: [{ model: Product }]
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cart item not found' });
    });

    it('should return 400 when maximum stock reached', async () => {
      req.params = { productId: '1' };
      const mockCustomer = { customerId: 1 };
      const mockCartItem = {
        quantity: 10,
        product: {
          quantity: 10,
          sellingNumber: 5
        }
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Cart.findOne.mockResolvedValue(mockCartItem);

      await cartController.incrementCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Maximum stock reached' });
    });

    it('should increment cart item quantity successfully', async () => {
      req.params = { productId: '1' };
      const mockCustomer = { customerId: 1 };
      const mockCartItem = {
        quantity: 2,
        product: {
          quantity: 10,
          sellingNumber: 5
        },
        save: jest.fn().mockResolvedValue()
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Cart.findOne.mockResolvedValue(mockCartItem);

      await cartController.incrementCartItem(req, res);

      expect(mockCartItem.quantity).toBe(3);
      expect(mockCartItem.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quantity incremented successfully',
        cartItem: mockCartItem
      });
    });

    it('should handle internal server error', async () => {
      req.params = { productId: '1' };
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await cartController.incrementCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('decrementCartItem', () => {
    it('should return 403 when customer not found', async () => {
      req.params = { productId: '1' };
      Customer.findOne.mockResolvedValue(null);

      await cartController.decrementCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
    });

    it('should return 404 when cart item not found', async () => {
      req.params = { productId: '999' };
      const mockCustomer = { customerId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Cart.findOne.mockResolvedValue(null);

      await cartController.decrementCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cart item not found' });
    });

    it('should remove cart item when quantity becomes 0', async () => {
      req.params = { productId: '1' };
      const mockCustomer = { customerId: 1 };
      const mockCartItem = {
        quantity: 1,
        destroy: jest.fn().mockResolvedValue()
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Cart.findOne.mockResolvedValue(mockCartItem);

      await cartController.decrementCartItem(req, res);

      expect(mockCartItem.quantity).toBe(0);
      expect(mockCartItem.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cart item removed completely' });
    });

    it('should decrement cart item quantity successfully', async () => {
      req.params = { productId: '1' };
      const mockCustomer = { customerId: 1 };
      const mockCartItem = {
        quantity: 3,
        save: jest.fn().mockResolvedValue()
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Cart.findOne.mockResolvedValue(mockCartItem);

      await cartController.decrementCartItem(req, res);

      expect(mockCartItem.quantity).toBe(2);
      expect(mockCartItem.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quantity decremented successfully',
        cartItem: mockCartItem
      });
    });

    it('should handle internal server error', async () => {
      req.params = { productId: '1' };
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      await cartController.decrementCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});
