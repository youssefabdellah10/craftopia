const orderController = require('../../src/controllers/orderController');
const Customer = require('../../src/models/customer');
const Order = require('../../src/models/order');
const Product = require('../../src/models/product');
const Product_Order = require('../../src/models/Product_Order');
const User = require('../../src/models/user');
const CustomizationResponse = require('../../src/models/customizationResponse');
const CustomizationRequest = require('../../src/models/customizationRequest');
const Artist = require('../../src/models/artist');
const Review = require('../../src/models/Review');
const { sendOrderConfirmationEmail, sendShipAuctionEmail, sendCustomizationShipEmail } = require('../../src/utils/emailService');
const { firebase_db } = require('../../src/config/firebase');

jest.mock('../../src/models/customer');
jest.mock('../../src/models/order');
jest.mock('../../src/models/product');
jest.mock('../../src/models/Product_Order');
jest.mock('../../src/models/user');
jest.mock('../../src/models/customizationResponse');
jest.mock('../../src/models/customizationRequest');
jest.mock('../../src/models/artist');
jest.mock('../../src/models/Review');
jest.mock('../../src/utils/emailService');
jest.mock('../../src/config/firebase');

describe('Order Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 1 },
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('placeOrder', () => {
        it('should successfully place an order', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockProducts = [
                { productId: 1, name: 'Product 1', price: 100, quantity: 10 },
                { productId: 2, name: 'Product 2', price: 200, quantity: 5 }
            ];
            const mockOrder = { orderId: 1, totalAmount: 400, customerId: 1, orderDate: new Date() };
            const mockUser = { id: 1, email: 'test@example.com' };

            req.body = {
                productIds: [1, 2],
                quantity: [2, 1]
            };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Product.findAll.mockResolvedValue(mockProducts);
            Order.create.mockResolvedValue(mockOrder);
            Product_Order.bulkCreate.mockResolvedValue([]);
            User.findByPk.mockResolvedValue(mockUser);
            sendOrderConfirmationEmail.mockResolvedValue();

            await orderController.placeOrder(req, res);

            expect(Customer.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
            expect(Product.findAll).toHaveBeenCalledWith({ where: { productId: [1, 2] } });
            expect(Order.create).toHaveBeenCalledWith({
                createdAt: expect.any(Date),
                totalAmount: 400,
                customerId: 1
            });
            expect(Product_Order.bulkCreate).toHaveBeenCalled();
            expect(sendOrderConfirmationEmail).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Order placed successfully',
                order: mockOrder
            });
        });

        it('should return 403 if customer not found', async () => {
            Customer.findOne.mockResolvedValue(null);

            await orderController.placeOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
        });

        it('should return 400 if productIds is invalid', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            Customer.findOne.mockResolvedValue(mockCustomer);

            req.body = { productIds: null, quantity: [1] };

            await orderController.placeOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Please provide a valid array of product IDs' });
        });

        it('should return 404 if not all products found', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockProducts = [{ productId: 1, name: 'Product 1', price: 100, quantity: 10 }];

            Customer.findOne.mockResolvedValue(mockCustomer);
            Product.findAll.mockResolvedValue(mockProducts);

            req.body = {
                productIds: [1, 2],
                quantity: [1, 1]
            };

            await orderController.placeOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'provide us with list of valid product' });
        });

        it('should return 400 if insufficient stock', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockProducts = [{ productId: 1, name: 'Product 1', price: 100, quantity: 2 }];

            Customer.findOne.mockResolvedValue(mockCustomer);
            Product.findAll.mockResolvedValue(mockProducts);

            req.body = {
                productIds: [1],
                quantity: [5]
            };

            await orderController.placeOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient stock for product Product 1' });
        });

        it('should handle email service errors gracefully', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockProducts = [{ productId: 1, name: 'Product 1', price: 100, quantity: 10 }];
            const mockOrder = { orderId: 1, totalAmount: 100, customerId: 1, orderDate: new Date() };
            const mockUser = { id: 1, email: 'test@example.com' };

            req.body = {
                productIds: [1],
                quantity: [1]
            };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Product.findAll.mockResolvedValue(mockProducts);
            Order.create.mockResolvedValue(mockOrder);
            Product_Order.bulkCreate.mockResolvedValue([]);
            User.findByPk.mockResolvedValue(mockUser);
            sendOrderConfirmationEmail.mockRejectedValue(new Error('Email service error'));

            console.error = jest.fn();

            await orderController.placeOrder(req, res);

            expect(console.error).toHaveBeenCalledWith('Error sending order confirmation email:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Order placed successfully',
                order: mockOrder
            });
        });

        it('should return 500 on internal server error', async () => {
            Customer.findOne.mockRejectedValue(new Error('Database error'));

            console.error = jest.fn();

            await orderController.placeOrder(req, res);

            expect(console.error).toHaveBeenCalledWith('Error placing order:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });

    describe('getmyOrders', () => {
        it('should successfully retrieve customer orders', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrders = [{
                orderId: 1,
                status: 'Completed',
                products: [{
                    productId: 1,
                    name: 'Product 1',
                    price: 100,
                    image: 'image.jpg',
                    type: 'regular',
                    dataValues: {}
                }]
            }];

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findAll.mockResolvedValue(mockOrders);
            Review.findOne.mockResolvedValue(null);

            await orderController.getmyOrders(req, res);

            expect(Customer.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
            expect(Order.findAll).toHaveBeenCalledWith({
                where: { customerId: 1 },
                include: [{
                    model: Product,
                    attributes: ['productId', 'name', 'price', 'image', 'type'],
                    through: {
                        attributes: ['quantity']
                    }
                }]
            });
            expect(mockOrders[0].products[0].dataValues.reviewed).toBe(false);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Orders retrieved successfully',
                orders: mockOrders
            });
        });

        it('should mark products as reviewed when review exists', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrders = [{
                orderId: 1,
                status: 'Completed',
                products: [{
                    productId: 1,
                    name: 'Product 1',
                    price: 100,
                    image: 'image.jpg',
                    type: 'regular',
                    dataValues: {}
                }]
            }];
            const mockReview = { reviewId: 1 };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findAll.mockResolvedValue(mockOrders);
            Review.findOne.mockResolvedValue(mockReview);

            await orderController.getmyOrders(req, res);

            expect(mockOrders[0].products[0].dataValues.reviewed).toBe(true);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 403 if customer not found', async () => {
            Customer.findOne.mockResolvedValue(null);

            await orderController.getmyOrders(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
        });

        it('should return 500 on internal server error', async () => {
            Customer.findOne.mockRejectedValue(new Error('Database error'));

            console.error = jest.fn();

            await orderController.getmyOrders(req, res);

            expect(console.error).toHaveBeenCalledWith('Error retrieving orders:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });

    describe('cancelOrder', () => {
        it('should successfully cancel a pending order', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = {
                orderId: 1,
                status: 'Pending',
                update: jest.fn().mockResolvedValue()
            };

            req.params = { orderId: 1 };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findOne.mockResolvedValue(mockOrder);

            await orderController.cancelOrder(req, res);

            expect(Customer.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
            expect(Order.findOne).toHaveBeenCalledWith({
                where: {
                    orderId: 1,
                    customerId: 1
                }
            });
            expect(mockOrder.update).toHaveBeenCalledWith({ status: 'Cancelled' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Order cancelled successfully',
                order: mockOrder
            });
        });

        it('should return 403 if customer not found', async () => {
            req.params = { orderId: 1 };
            Customer.findOne.mockResolvedValue(null);

            await orderController.cancelOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
        });

        it('should return 404 if order not found', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };

            req.params = { orderId: 1 };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findOne.mockResolvedValue(null);

            await orderController.cancelOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Order not found' });
        });

        it('should return 400 if order is not pending', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = { orderId: 1, status: 'Completed' };

            req.params = { orderId: 1 };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findOne.mockResolvedValue(mockOrder);

            await orderController.cancelOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Order cannot be cancelled as it is cancelled or completed before' });
        });

        it('should return 500 on internal server error', async () => {
            req.params = { orderId: 1 };
            Customer.findOne.mockRejectedValue(new Error('Database error'));

            console.error = jest.fn();

            await orderController.cancelOrder(req, res);

            expect(console.error).toHaveBeenCalledWith('Error cancelling order:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });

    describe('getOrderById', () => {
        it('should successfully retrieve order by ID', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = {
                orderId: 1,
                products: [{
                    productId: 1,
                    name: 'Product 1',
                    price: 100,
                    description: 'Test product',
                    image: 'image.jpg'
                }]
            };

            req.params = { orderId: 1 };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findOne.mockResolvedValue(mockOrder);

            await orderController.getOrderById(req, res);

            expect(Customer.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
            expect(Order.findOne).toHaveBeenCalledWith({
                where: {
                    orderId: 1,
                    customerId: 1
                },
                include: [{
                    model: Product,
                    attributes: ['productId', 'name', 'price', 'description', 'image'],
                    through: {
                        attributes: ['quantity']
                    }
                }]
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Order retrieved successfully',
                order: mockOrder
            });
        });

        it('should return 400 if orderId is missing', async () => {
            req.params = {};

            await orderController.getOrderById(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Order ID is required' });
        });

        it('should return 403 if customer not found', async () => {
            req.params = { orderId: 1 };
            Customer.findOne.mockResolvedValue(null);

            await orderController.getOrderById(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Customer not found' });
        });

        it('should return 404 if order not found', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };

            req.params = { orderId: 1 };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findOne.mockResolvedValue(null);

            await orderController.getOrderById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Order not found' });
        });

        it('should return 500 on internal server error', async () => {
            req.params = { orderId: 1 };
            Customer.findOne.mockRejectedValue(new Error('Database error'));

            console.error = jest.fn();

            await orderController.getOrderById(req, res);

            expect(console.error).toHaveBeenCalledWith('Error retrieving order:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });

    describe('shipOrder', () => {
        it('should successfully ship a customization order', async () => {
            const mockResponse = {
                respondId: 1,
                status: 'ACCEPTED',
                requestId: 1,
                artistId: 1,
                price: 500
            };
            const mockRequest = { orderId: 1, customerId: 1 };
            const mockArtist = { artistId: 1, userId: 1 };
            const mockRealArtist = { artistId: 1 };
            const mockOrder = {
                orderId: 1,
                status: 'Completed',
                totalAmount: 500,
                createdAt: new Date(),
                save: jest.fn().mockResolvedValue()
            };
            const mockCustomer = { customerId: 1, userId: 2 };
            const mockUser = { id: 2, email: 'customer@example.com', name: 'John Doe' };

            req.params = { respondId: 1 };

            CustomizationResponse.findByPk.mockResolvedValue(mockResponse);
            CustomizationRequest.findByPk.mockResolvedValue(mockRequest);
            Artist.findOne.mockResolvedValue(mockArtist);
            Artist.findByPk.mockResolvedValue(mockRealArtist);
            Order.findOne.mockResolvedValue(mockOrder);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            User.findByPk.mockResolvedValue(mockUser);
            sendCustomizationShipEmail.mockResolvedValue();

            await orderController.shipOrder(req, res);

            expect(CustomizationResponse.findByPk).toHaveBeenCalledWith(1);
            expect(mockOrder.save).toHaveBeenCalled();
            expect(mockOrder.status).toBe('Shipped');
            expect(mockOrder.shippedAt).toBeInstanceOf(Date);
            expect(sendCustomizationShipEmail).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Order shipped successfully',
                order: {
                    orderId: 1,
                    totalAmount: 500,
                    status: 'Shipped',
                    createdAt: mockOrder.createdAt
                }
            });
        });

        it('should return 404 if customization response not found', async () => {
            req.params = { respondId: 1 };
            CustomizationResponse.findByPk.mockResolvedValue(null);

            await orderController.shipOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Customization response not found' });
        });

        it('should return 400 if customization response is not accepted', async () => {
            const mockResponse = { respondId: 1, status: 'PENDING' };

            req.params = { respondId: 1 };
            CustomizationResponse.findByPk.mockResolvedValue(mockResponse);

            await orderController.shipOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Customization response is not accepted' });
        });

        it('should return 403 if artist is not authorized', async () => {
            const mockResponse = { respondId: 1, status: 'ACCEPTED', requestId: 1, artistId: 2 };
            const mockRequest = { orderId: 1, customerId: 1 };
            const mockArtist = { artistId: 1, userId: 1 };
            const mockRealArtist = { artistId: 2 };

            req.params = { respondId: 1 };

            CustomizationResponse.findByPk.mockResolvedValue(mockResponse);
            CustomizationRequest.findByPk.mockResolvedValue(mockRequest);
            Artist.findOne.mockResolvedValue(mockArtist);
            Artist.findByPk.mockResolvedValue(mockRealArtist);

            await orderController.shipOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'this Artist is not authorized for shipping this order' });
        });

        it('should return 404 if order not found', async () => {
            const mockResponse = { respondId: 1, status: 'ACCEPTED', requestId: 1, artistId: 1 };
            const mockRequest = { orderId: 1, customerId: 1 };
            const mockArtist = { artistId: 1, userId: 1 };
            const mockRealArtist = { artistId: 1 };

            req.params = { respondId: 1 };

            CustomizationResponse.findByPk.mockResolvedValue(mockResponse);
            CustomizationRequest.findByPk.mockResolvedValue(mockRequest);
            Artist.findOne.mockResolvedValue(mockArtist);
            Artist.findByPk.mockResolvedValue(mockRealArtist);
            Order.findOne.mockResolvedValue(null);

            await orderController.shipOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Order not found' });
        });

        it('should return 400 if order is already shipped', async () => {
            const mockResponse = { respondId: 1, status: 'ACCEPTED', requestId: 1, artistId: 1 };
            const mockRequest = { orderId: 1, customerId: 1 };
            const mockArtist = { artistId: 1, userId: 1 };
            const mockRealArtist = { artistId: 1 };
            const mockOrder = { orderId: 1, status: 'Shipped' };

            req.params = { respondId: 1 };

            CustomizationResponse.findByPk.mockResolvedValue(mockResponse);
            CustomizationRequest.findByPk.mockResolvedValue(mockRequest);
            Artist.findOne.mockResolvedValue(mockArtist);
            Artist.findByPk.mockResolvedValue(mockRealArtist);
            Order.findOne.mockResolvedValue(mockOrder);

            await orderController.shipOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Order is already shipped' });
        });

        it('should return 400 if order is not completed', async () => {
            const mockResponse = { respondId: 1, status: 'ACCEPTED', requestId: 1, artistId: 1 };
            const mockRequest = { orderId: 1, customerId: 1 };
            const mockArtist = { artistId: 1, userId: 1 };
            const mockRealArtist = { artistId: 1 };
            const mockOrder = { orderId: 1, status: 'Pending' };

            req.params = { respondId: 1 };

            CustomizationResponse.findByPk.mockResolvedValue(mockResponse);
            CustomizationRequest.findByPk.mockResolvedValue(mockRequest);
            Artist.findOne.mockResolvedValue(mockArtist);
            Artist.findByPk.mockResolvedValue(mockRealArtist);
            Order.findOne.mockResolvedValue(mockOrder);

            await orderController.shipOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Customer should pay first,before shipping the order' });
        });

        it('should handle email service errors gracefully', async () => {
            const mockResponse = {
                respondId: 1,
                status: 'ACCEPTED',
                requestId: 1,
                artistId: 1,
                price: 500
            };
            const mockRequest = { orderId: 1, customerId: 1 };
            const mockArtist = { artistId: 1, userId: 1 };
            const mockRealArtist = { artistId: 1 };
            const mockOrder = {
                orderId: 1,
                status: 'Completed',
                totalAmount: 500,
                createdAt: new Date(),
                save: jest.fn().mockResolvedValue()
            };
            const mockCustomer = { customerId: 1, userId: 2 };
            const mockUser = { id: 2, email: 'customer@example.com', name: 'John Doe' };

            req.params = { respondId: 1 };

            CustomizationResponse.findByPk.mockResolvedValue(mockResponse);
            CustomizationRequest.findByPk.mockResolvedValue(mockRequest);
            Artist.findOne.mockResolvedValue(mockArtist);
            Artist.findByPk.mockResolvedValue(mockRealArtist);
            Order.findOne.mockResolvedValue(mockOrder);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            User.findByPk.mockResolvedValue(mockUser);
            sendCustomizationShipEmail.mockRejectedValue(new Error('Email service error'));

            console.error = jest.fn();

            await orderController.shipOrder(req, res);

            expect(console.error).toHaveBeenCalledWith('Error sending order ship email:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 500 on internal server error', async () => {
            req.params = { respondId: 1 };
            CustomizationResponse.findByPk.mockRejectedValue(new Error('Database error'));

            console.error = jest.fn();

            await orderController.shipOrder(req, res);

            expect(console.error).toHaveBeenCalledWith('Error shipping order:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });

    describe('shipAuctionOrder', () => {
        beforeEach(() => {
            firebase_db.ref = jest.fn().mockReturnThis();
            firebase_db.ref.prototype.once = jest.fn();
            firebase_db.ref.prototype.update = jest.fn();
        });

        it('should successfully ship an auction order', async () => {
            const mockAuctionData = {
                artistId: 1,
                endDate: new Date(Date.now() - 1000).toISOString(),
                productDetails: { name: 'Auction Product' },
                productId: 1,
                bids: {
                    bid1: { bidId: 'bid1', customerId: 1, bidAmount: 500, timestamp: new Date() }
                }
            };
            const mockArtist = { artistId: 1, userId: 1 };
            const mockCustomer = { customerId: 1, userId: 2 };
            const mockUser = { id: 2, email: 'winner@example.com', name: 'Winner User' };
            const mockOrder = {
                orderId: 1,
                totalAmount: 500,
                status: 'Completed',
                createdAt: new Date(),
                save: jest.fn().mockResolvedValue()
            };

            req.params = { auctionId: 'auction123' };

            const mockAuctionSnapshot = {
                exists: () => true,
                val: () => mockAuctionData
            };

            firebase_db.ref.mockImplementation((path) => ({
                once: jest.fn().mockResolvedValue(mockAuctionSnapshot),
                update: jest.fn().mockResolvedValue()
            }));

            Artist.findOne.mockResolvedValue(mockArtist);
            Order.findOne.mockResolvedValue(mockOrder);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            User.findByPk.mockResolvedValue(mockUser);
            sendShipAuctionEmail.mockResolvedValue();

            await orderController.shipAuctionOrder(req, res);

            expect(Artist.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
            expect(Order.findOne).toHaveBeenCalledWith({
                where: { customerId: 1 },
                include: [{
                    model: Product_Order,
                    where: { productId: 1 }
                }],
                order: [['createdAt', 'DESC']]
            });
            expect(Customer.findByPk).toHaveBeenCalledWith(1);
            expect(mockOrder.save).toHaveBeenCalled();
            expect(sendShipAuctionEmail).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Auction order shipped successfully',
                order: {
                    orderId: 1,
                    totalAmount: 500,
                    status: 'Shipped',
                    createdAt: mockOrder.createdAt,
                    shippedAt: expect.any(Date),
                    auctionId: 'auction123'
                }
            });
        });

        it('should return 404 if auction not found', async () => {
            req.params = { auctionId: 'auction123' };

            const mockAuctionSnapshot = {
                exists: () => false
            };

            firebase_db.ref.mockReturnValue({
                once: jest.fn().mockResolvedValue(mockAuctionSnapshot)
            });

            await orderController.shipAuctionOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Auction not found' });
        });

        it('should return 403 if artist is not authorized', async () => {
            const mockAuctionData = { artistId: 2, endDate: new Date(Date.now() - 1000).toISOString() };
            const mockArtist = { artistId: 1, userId: 1 };

            req.params = { auctionId: 'auction123' };

            const mockAuctionSnapshot = {
                exists: () => true,
                val: () => mockAuctionData
            };

            firebase_db.ref.mockReturnValue({
                once: jest.fn().mockResolvedValue(mockAuctionSnapshot)
            });

            Artist.findOne.mockResolvedValue(mockArtist);

            await orderController.shipAuctionOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'This Artist is not authorized for shipping this auction order' });
        });

        it('should return 400 if auction has not ended', async () => {
            const mockAuctionData = {
                artistId: 1,
                endDate: new Date(Date.now() + 10000).toISOString()
            };
            const mockArtist = { artistId: 1, userId: 1 };

            req.params = { auctionId: 'auction123' };

            const mockAuctionSnapshot = {
                exists: () => true,
                val: () => mockAuctionData
            };

            firebase_db.ref.mockReturnValue({
                once: jest.fn().mockResolvedValue(mockAuctionSnapshot)
            });

            Artist.findOne.mockResolvedValue(mockArtist);

            await orderController.shipAuctionOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Auction has not ended yet' });
        });

        it('should return 400 if no bids found', async () => {
            const mockAuctionData = {
                artistId: 1,
                endDate: new Date(Date.now() - 1000).toISOString()
                // no bids property
            };
            const mockArtist = { artistId: 1, userId: 1 };

            req.params = { auctionId: 'auction123' };

            const mockAuctionSnapshot = {
                exists: () => true,
                val: () => mockAuctionData
            };

            firebase_db.ref.mockReturnValue({
                once: jest.fn().mockResolvedValue(mockAuctionSnapshot)
            });

            Artist.findOne.mockResolvedValue(mockArtist);

            await orderController.shipAuctionOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'No bids found for this auction' });
        });

        it('should return 404 if order not found for auction', async () => {
            const mockAuctionData = {
                artistId: 1,
                endDate: new Date(Date.now() - 1000).toISOString(),
                productId: 1,
                bids: {
                    bid1: { bidId: 'bid1', customerId: 1, bidAmount: 500, timestamp: new Date() }
                }
            };
            const mockArtist = { artistId: 1, userId: 1 };

            req.params = { auctionId: 'auction123' };

            const mockAuctionSnapshot = {
                exists: () => true,
                val: () => mockAuctionData
            };

            firebase_db.ref.mockReturnValue({
                once: jest.fn().mockResolvedValue(mockAuctionSnapshot)
            });

            Artist.findOne.mockResolvedValue(mockArtist);
            Order.findOne.mockResolvedValue(null);

            await orderController.shipAuctionOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Order not found for this auction. The order should have been created automatically when the auction ended.' });
        });

        it('should handle email service errors gracefully', async () => {
            const mockAuctionData = {
                artistId: 1,
                endDate: new Date(Date.now() - 1000).toISOString(),
                productDetails: { name: 'Auction Product' },
                productId: 1,
                bids: {
                    bid1: { bidId: 'bid1', customerId: 1, bidAmount: 500, timestamp: new Date() }
                }
            };
            const mockArtist = { artistId: 1, userId: 1 };
            const mockCustomer = { customerId: 1, userId: 2 };
            const mockUser = { id: 2, email: 'winner@example.com', name: 'Winner User' };
            const mockOrder = {
                orderId: 1,
                totalAmount: 500,
                status: 'Completed',
                createdAt: new Date(),
                save: jest.fn().mockResolvedValue()
            };

            req.params = { auctionId: 'auction123' };

            const mockAuctionSnapshot = {
                exists: () => true,
                val: () => mockAuctionData
            };

            firebase_db.ref.mockImplementation((path) => ({
                once: jest.fn().mockResolvedValue(mockAuctionSnapshot),
                update: jest.fn().mockResolvedValue()
            }));

            Artist.findOne.mockResolvedValue(mockArtist);
            Order.findOne.mockResolvedValue(mockOrder);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            User.findByPk.mockResolvedValue(mockUser);
            sendShipAuctionEmail.mockRejectedValue(new Error('Email service error'));

            console.error = jest.fn();

            await orderController.shipAuctionOrder(req, res);

            expect(console.error).toHaveBeenCalledWith('Error sending auction ship email:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 500 on internal server error', async () => {
            req.params = { auctionId: 'auction123' };

            firebase_db.ref.mockImplementation(() => {
                throw new Error('Firebase error');
            });

            console.error = jest.fn();

            await orderController.shipAuctionOrder(req, res);

            expect(console.error).toHaveBeenCalledWith('Error shipping auction order:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });
});
