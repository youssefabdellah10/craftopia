const paymentGatewayController = require('../../src/controllers/paymentGateway');
const Order = require('../../src/models/order');
const Customer = require('../../src/models/customer');
const Artist = require('../../src/models/artist');
const Payment = require('../../src/models/payment');
const User = require('../../src/models/user');
const CreditCard = require('../../src/models/creditCard');
const Product = require('../../src/models/product');
const Sales = require('../../src/models/sales');
const ProductOrder = require('../../src/models/Product_Order');
const { sendPaymentConfirmationEmail } = require('../../src/utils/emailService');

jest.mock('../../src/models/order');
jest.mock('../../src/models/customer');
jest.mock('../../src/models/artist');
jest.mock('../../src/models/payment');
jest.mock('../../src/models/user');
jest.mock('../../src/models/creditCard');
jest.mock('../../src/models/product');
jest.mock('../../src/models/sales');
jest.mock('../../src/models/Product_Order');
jest.mock('../../src/utils/emailService');

describe('Payment Gateway Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 1 },
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('createEscrowPayment', () => {
        beforeEach(() => {
            req.params = { orderId: 1 };
            req.query = {
                creditCardNumber: '1234567890123456',
                expiryDate: '12/25'
            };
        });

        it('should successfully create escrow payment', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = {
                orderId: 1,
                customerId: 1,
                status: 'Pending',
                totalAmount: 500,
                createdAt: new Date(),
                update: jest.fn().mockResolvedValue()
            };
            const mockCreditCard = {
                number: '1234567890123456',
                expiryDate: '12/25',
                amount: 1000,
                update: jest.fn().mockResolvedValue()
            };
            const mockPayment = {
                paymentId: 1,
                amount: 500,
                currency: 'USD',
                createdAt: new Date()
            };
            const mockProductOrders = [{
                orderId: 1,
                productId: 1,
                quantity: 2
            }];
            const mockProduct = {
                productId: 1,
                name: 'Test Product',
                quantity: 10,
                save: jest.fn().mockResolvedValue()
            };
            const mockUser = { id: 1, email: 'test@example.com' };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findByPk.mockResolvedValue(mockOrder);
            CreditCard.findOne.mockResolvedValue(mockCreditCard);
            ProductOrder.findAll.mockResolvedValue(mockProductOrders);
            Product.findByPk.mockResolvedValue(mockProduct);
            Payment.create.mockResolvedValue(mockPayment);
            User.findByPk.mockResolvedValue(mockUser);
            sendPaymentConfirmationEmail.mockResolvedValue();

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(Order.findByPk).toHaveBeenCalledWith(1);
            expect(CreditCard.findOne).toHaveBeenCalledWith({ where: { number: '1234567890123456' } });
            expect(Payment.create).toHaveBeenCalledWith({
                orderId: 1,
                customerId: 1,
                amount: 500,
                paymentReference: '1234567890123456',
                status: 'held_in_escrow',
                transactionType: 'payment'
            });
            expect(mockCreditCard.update).toHaveBeenCalledWith({ amount: 500 });
            expect(mockOrder.update).toHaveBeenCalledWith({
                status: 'Completed',
                paymentId: 1,
                updatedAt: expect.any(Date)
            });
            expect(mockProduct.quantity).toBe(8);
            expect(mockProduct.save).toHaveBeenCalled();
            expect(sendPaymentConfirmationEmail).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Payment successful! Funds are held in escrow until order completion.',
                data: expect.objectContaining({
                    paymentId: 1,
                    orderId: 1,
                    amount: 500,
                    status: 'held_in_escrow'
                })
            });
        });

        it('should return 400 if orderId is missing', async () => {
            req.params = {};

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Order ID is required'
            });
        });

        it('should return 400 if creditCardNumber is missing', async () => {
            req.query = { expiryDate: '12/25' };

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Credit Card number is required'
            });
        });

        it('should return 400 if creditCardNumber is not 16 characters', async () => {
            req.query = {
                creditCardNumber: '12345',
                expiryDate: '12/25'
            };

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Credit card number must be exactly 16 characters'
            });
        });

        it('should return 404 if order not found', async () => {
            Order.findByPk.mockResolvedValue(null);

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Order not found'
            });
        });

        it('should return 403 if user is not authorized for this order', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = { orderId: 1, customerId: 2, status: 'Pending' };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findByPk.mockResolvedValue(mockOrder);

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'You are not authorized to pay for this order'
            });
        });

        it('should return 400 if order is already completed', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = { orderId: 1, customerId: 1, status: 'Completed' };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findByPk.mockResolvedValue(mockOrder);

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Order is already paid'
            });
        });

        it('should return 400 if order is cancelled', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = { orderId: 1, customerId: 1, status: 'Cancelled' };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findByPk.mockResolvedValue(mockOrder);

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Order is cancelled and cannot be paid'
            });
        });

        it('should return 404 if credit card is invalid', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = { orderId: 1, customerId: 1, status: 'Pending' };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findByPk.mockResolvedValue(mockOrder);
            CreditCard.findOne.mockResolvedValue(null);

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Credit card is invalid, payment failed'
            });
        });

        it('should return 400 if credit card has expired', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = { orderId: 1, customerId: 1, status: 'Pending', totalAmount: 500 };
            const mockCreditCard = {
                number: '1234567890123456',
                expiryDate: '01/20',
                amount: 1000
            };

            req.query = {
                creditCardNumber: '1234567890123456',
                expiryDate: '01/20'
            };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findByPk.mockResolvedValue(mockOrder);
            CreditCard.findOne.mockResolvedValue(mockCreditCard);
            ProductOrder.findAll.mockResolvedValue([]);
            Payment.create.mockResolvedValue({});

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(Payment.create).toHaveBeenCalledWith({
                orderId: 1,
                customerId: 1,
                amount: 0,
                paymentReference: '1234567890123456',
                status: 'failed',
                transactionType: 'payment'
            });
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Credit card has expired, payment failed'
            });
        });

        it('should return 400 if insufficient funds', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = { orderId: 1, customerId: 1, status: 'Pending', totalAmount: 500 };
            const mockCreditCard = {
                number: '1234567890123456',
                expiryDate: '12/25',
                amount: 100
            };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findByPk.mockResolvedValue(mockOrder);
            CreditCard.findOne.mockResolvedValue(mockCreditCard);
            Payment.create.mockResolvedValue({});

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(Payment.create).toHaveBeenCalledWith({
                orderId: 1,
                customerId: 1,
                amount: 0,
                paymentReference: '1234567890123456',
                status: 'failed',
                transactionType: 'payment'
            });
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Insufficient funds in credit card, payment failed'
            });
        });

        it('should return 400 if no products found in order', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = { orderId: 1, customerId: 1, status: 'Pending', totalAmount: 500 };
            const mockCreditCard = {
                number: '1234567890123456',
                expiryDate: '12/25',
                amount: 1000
            };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findByPk.mockResolvedValue(mockOrder);
            CreditCard.findOne.mockResolvedValue(mockCreditCard);
            ProductOrder.findAll.mockResolvedValue([]);

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No products found in the order'
            });
        });

        it('should return 404 if product not found', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = { orderId: 1, customerId: 1, status: 'Pending', totalAmount: 500 };
            const mockCreditCard = {
                number: '1234567890123456',
                expiryDate: '12/25',
                amount: 1000
            };
            const mockProductOrders = [{ orderId: 1, productId: 1, quantity: 2 }];

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findByPk.mockResolvedValue(mockOrder);
            CreditCard.findOne.mockResolvedValue(mockCreditCard);
            ProductOrder.findAll.mockResolvedValue(mockProductOrders);
            Product.findByPk.mockResolvedValue(null);

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Product not found'
            });
        });

        it('should return 400 if insufficient stock', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = { orderId: 1, customerId: 1, status: 'Pending', totalAmount: 500 };
            const mockCreditCard = {
                number: '1234567890123456',
                expiryDate: '12/25',
                amount: 1000
            };
            const mockProductOrders = [{ orderId: 1, productId: 1, quantity: 10 }];
            const mockProduct = { productId: 1, name: 'Test Product', quantity: 5 };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findByPk.mockResolvedValue(mockOrder);
            CreditCard.findOne.mockResolvedValue(mockCreditCard);
            ProductOrder.findAll.mockResolvedValue(mockProductOrders);
            Product.findByPk.mockResolvedValue(mockProduct);

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Insufficient stock for product Test Product, you can try again later when the stock is updated'
            });
        });

        it('should handle email service errors gracefully', async () => {
            const mockCustomer = { customerId: 1, userId: 1 };
            const mockOrder = {
                orderId: 1,
                customerId: 1,
                status: 'Pending',
                totalAmount: 500,
                createdAt: new Date(),
                update: jest.fn().mockResolvedValue()
            };
            const mockCreditCard = {
                number: '1234567890123456',
                expiryDate: '12/25',
                amount: 1000,
                update: jest.fn().mockResolvedValue()
            };
            const mockPayment = { paymentId: 1, amount: 500, currency: 'USD', createdAt: new Date() };
            const mockProductOrders = [{ orderId: 1, productId: 1, quantity: 2 }];
            const mockProduct = {
                productId: 1,
                name: 'Test Product',
                quantity: 10,
                save: jest.fn().mockResolvedValue()
            };
            const mockUser = { id: 1, email: 'test@example.com' };

            Customer.findOne.mockResolvedValue(mockCustomer);
            Order.findByPk.mockResolvedValue(mockOrder);
            CreditCard.findOne.mockResolvedValue(mockCreditCard);
            ProductOrder.findAll.mockResolvedValue(mockProductOrders);
            Product.findByPk.mockResolvedValue(mockProduct);
            Payment.create.mockResolvedValue(mockPayment);
            User.findByPk.mockResolvedValue(mockUser);
            sendPaymentConfirmationEmail.mockRejectedValue(new Error('Email service error'));

            console.error = jest.fn();

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(console.error).toHaveBeenCalledWith('Error sending payment confirmation email:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return 500 on internal server error', async () => {
            Order.findByPk.mockRejectedValue(new Error('Database error'));

            console.error = jest.fn();

            await paymentGatewayController.createEscrowPayment(req, res);

            expect(console.error).toHaveBeenCalledWith('Error processing escrow payment:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error during payment processing'
            });
        });
    });

    describe('releaseEscrowPayment', () => {
        beforeEach(() => {
            req.params = { paymentId: 1 };
        });

        it('should successfully release escrow payment', async () => {
            const mockUser = { id: 1, role: 'admin' };
            const mockPayment = {
                paymentId: 1,
                status: 'held_in_escrow',
                orderId: 1,
                update: jest.fn().mockResolvedValue()
            };
            const mockOrder = {
                orderId: 1,
                products: [{
                    productId: 1,
                    price: 100,
                    artist: { artistId: 1, name: 'Artist 1' },
                    productorder: { quantity: 2 }
                }]
            };
            const mockArtist = { artistId: 1, sales: 500 };

            User.findByPk.mockResolvedValue(mockUser);
            Payment.findByPk.mockResolvedValue(mockPayment);
            Order.findByPk.mockResolvedValue(mockOrder);
            Artist.findByPk.mockResolvedValue(mockArtist);
            Product.update.mockResolvedValue();
            Sales.create.mockResolvedValue();
            Artist.update.mockResolvedValue();

            await paymentGatewayController.releaseEscrowPayment(req, res);

            expect(User.findByPk).toHaveBeenCalledWith(1);
            expect(Payment.findByPk).toHaveBeenCalledWith(1);
            expect(mockPayment.update).toHaveBeenCalledWith({
                status: 'released',
                releasedAt: expect.any(Date)
            });
            expect(Sales.create).toHaveBeenCalledWith({
                artistId: 1,
                paymentId: 1,
                salesAmount: 200
            });
            expect(Artist.update).toHaveBeenCalledWith(
                { sales: 700 },
                { where: { artistId: 1 } }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Payment released successfully and artists sales updated'
            });
        });

        it('should return 400 if paymentId is missing', async () => {
            req.params = {};

            await paymentGatewayController.releaseEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Payment ID is required'
            });
        });

        it('should return 404 if user not found or unauthorized', async () => {
            User.findByPk.mockResolvedValue(null);

            await paymentGatewayController.releaseEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found or unauthorized'
            });
        });

        it('should return 404 if user is not admin', async () => {
            const mockUser = { id: 1, role: 'customer' };
            User.findByPk.mockResolvedValue(mockUser);

            await paymentGatewayController.releaseEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found or unauthorized'
            });
        });

        it('should return 404 if payment not found', async () => {
            const mockUser = { id: 1, role: 'admin' };
            User.findByPk.mockResolvedValue(mockUser);
            Payment.findByPk.mockResolvedValue(null);

            await paymentGatewayController.releaseEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Payment not found'
            });
        });

        it('should return 400 if payment is not held in escrow', async () => {
            const mockUser = { id: 1, role: 'admin' };
            const mockPayment = { paymentId: 1, status: 'released' };

            User.findByPk.mockResolvedValue(mockUser);
            Payment.findByPk.mockResolvedValue(mockPayment);

            await paymentGatewayController.releaseEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Payment is not held in escrow'
            });
        });

        it('should return 404 if order not found', async () => {
            const mockUser = { id: 1, role: 'admin' };
            const mockPayment = { paymentId: 1, status: 'held_in_escrow', orderId: 1 };

            User.findByPk.mockResolvedValue(mockUser);
            Payment.findByPk.mockResolvedValue(mockPayment);
            Order.findByPk.mockResolvedValue(null);

            await paymentGatewayController.releaseEscrowPayment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Order not found'
            });
        });

        it('should return 500 on internal server error', async () => {
            User.findByPk.mockRejectedValue(new Error('Database error'));

            console.error = jest.fn();

            await paymentGatewayController.releaseEscrowPayment(req, res);

            expect(console.error).toHaveBeenCalledWith('Error releasing escrow payment:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error during payment processing'
            });
        });
    });

    describe('getallpaymentsHeld', () => {
        it('should successfully retrieve all held payments', async () => {
            const mockPayments = [
                { paymentId: 1, status: 'held_in_escrow', amount: 500 },
                { paymentId: 2, status: 'held_in_escrow', amount: 300 }
            ];

            Payment.findAll.mockResolvedValue(mockPayments);

            await paymentGatewayController.getallpaymentsHeld(req, res);

            expect(Payment.findAll).toHaveBeenCalledWith({
                where: { status: 'held_in_escrow' }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockPayments
            });
        });

        it('should return 500 on internal server error', async () => {
            Payment.findAll.mockRejectedValue(new Error('Database error'));

            console.error = jest.fn();

            await paymentGatewayController.getallpaymentsHeld(req, res);

            expect(console.error).toHaveBeenCalledWith('Error fetching held payments:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error while fetching held payments'
            });
        });
    });
});
