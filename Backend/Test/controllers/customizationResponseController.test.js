jest.mock('../../src/models/customizationRequest', () => ({
  findOne: jest.fn(),
  update: jest.fn()
}));
jest.mock('../../src/models/artist', () => ({
  findOne: jest.fn()
}));
jest.mock('../../src/models/customer', () => ({
  findOne: jest.fn()
}));
jest.mock('../../src/models/customizationResponse', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));
jest.mock('../../src/models/order', () => ({
  create: jest.fn()
}));
jest.mock('../../src/models/product', () => ({
  create: jest.fn()
}));
jest.mock('../../src/models/Product_Order', () => ({
  create: jest.fn()
}));
jest.mock('../../src/models/user', () => ({
  findByPk: jest.fn()
}));
jest.mock('../../src/utils/cloudinaryUpload', () => ({
  uploadBuffer: jest.fn()
}));
jest.mock('../../src/utils/customizationUtils', () => ({
  autoDeclinePendingResponses: jest.fn(),
  getArtistResponsesEnhanced: jest.fn(),
  getCustomerResponsesEnhanced: jest.fn()
}));
jest.mock('../../src/utils/emailService', () => ({
  sendCustomizationResponseEmail: jest.fn()
}));
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const CustomizationRequest = require('../../src/models/customizationRequest');
const Artist = require('../../src/models/artist');
const Customer = require('../../src/models/customer');
const CustomizationResponse = require('../../src/models/customizationResponse');
const Order = require('../../src/models/order');
const Product = require('../../src/models/product');
const Product_Order = require('../../src/models/Product_Order');
const User = require('../../src/models/user');
const { uploadBuffer } = require('../../src/utils/cloudinaryUpload');
const { autoDeclinePendingResponses, getArtistResponsesEnhanced, getCustomerResponsesEnhanced } = require('../../src/utils/customizationUtils');
const { sendCustomizationResponseEmail } = require('../../src/utils/emailService');
const { validationResult } = require('express-validator');
const customizationResponseController = require('../../src/controllers/customizationResponseController');

describe('Customization Response Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {},
      params: {},
      file: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('respondToCustomizationRequest', () => {
    beforeEach(() => {
      req.user = { id: 1 };
      req.params = { requestId: '1' };
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-01T00:00:00.000Z').getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create new response successfully', async () => {
      const mockArtist = { artistId: 1, userId: 1, name: 'Test Artist' };
      const mockRequest = { requestId: 1, status: 'OPEN', title: 'Test Request', customerId: 1 };
      const mockCustomer = { customerId: 1, userId: 2, name: 'Test Customer' };
      const mockUser = { userId: 2, email: 'customer@test.com' };
      const mockResponse = {
        responseId: 1,
        price: 100,
        notes: 'Test notes',
        estimationCompletionTime: new Date('2025-12-31T00:00:00.000Z'),
        artistId: 1,
        requestId: 1,
        image: null,
        status: 'PENDING',
        createdAt: new Date()
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      CustomizationResponse.findOne.mockResolvedValue(null);
      CustomizationResponse.create.mockResolvedValue(mockResponse);
      Customer.findOne.mockResolvedValue(mockCustomer);
      User.findByPk.mockResolvedValue(mockUser);
      sendCustomizationResponseEmail.mockResolvedValue();

      req.body = {
        price: 100,
        notes: 'Test notes',
        estimationCompletionDate: '2025-12-31'
      };

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(CustomizationResponse.create).toHaveBeenCalledWith({
        price: 100,
        notes: 'Test notes',
        estimationCompletionTime: new Date('2025-12-31T00:00:00.000Z'),
        artistId: 1,
        requestId: 1,
        image: null,
        status: 'PENDING'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Response created successfully',
        response: expect.objectContaining({
          responseId: 1,
          price: 100,
          notes: 'Test notes'
        })
      });
    });

    it('should return validation errors when present', async () => {
      const mockErrors = {
        isEmpty: () => false,
        array: () => [{ field: 'price', message: 'Price is required' }]
      };
      validationResult.mockReturnValue(mockErrors);

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: [{ field: 'price', message: 'Price is required' }]
      });
    });

    it('should return 403 when artist not found', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(null);

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You are not authorized to respond to customization requests'
      });
    });

    it('should return 404 when request not found', async () => {
      const mockArtist = { artistId: 1, userId: 1 };

      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findOne.mockResolvedValue(null);

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Customization request not found'
      });
    });

    it('should return 400 when request is already closed', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequest = { requestId: 1, status: 'CLOSED' };

      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Request is already closed',
        requestStatus: 'CLOSED'
      });
    });

    it('should return 400 when artist already has pending response', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequest = { requestId: 1, status: 'OPEN' };
      const mockExistingResponse = { responseId: 1, status: 'PENDING' };

      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      CustomizationResponse.findOne.mockResolvedValue(mockExistingResponse);

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You have already responded to this request',
        existingResponseId: 1,
        existingResponseStatus: 'PENDING'
      });
    });

    it('should return 400 when estimation date is in the past', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequest = { requestId: 1, status: 'OPEN' };

      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      CustomizationResponse.findOne.mockResolvedValue(null);

      req.body = {
        price: 100,
        notes: 'Test notes',
        estimationCompletionDate: '2024-12-31' // Past date
      };

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Estimation completion date must be in the future'
      });
    });

    it('should handle file upload successfully', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequest = { requestId: 1, status: 'OPEN', customerId: 1 };
      const mockResponse = { responseId: 1, image: 'https://cloudinary.com/image.jpg' };

      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      CustomizationResponse.findOne.mockResolvedValue(null);
      uploadBuffer.mockResolvedValue({ secure_url: 'https://cloudinary.com/image.jpg' });
      CustomizationResponse.create.mockResolvedValue(mockResponse);
      Customer.findOne.mockResolvedValue(null);

      req.body = {
        price: 100,
        notes: 'Test notes',
        estimationCompletionDate: '2025-12-31'
      };
      req.file = { buffer: Buffer.from('test image') };

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(uploadBuffer).toHaveBeenCalledWith(req.file.buffer, {
        folder: 'artists/1/customizationResponses',
        resource_type: 'image'
      });
      expect(CustomizationResponse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          image: 'https://cloudinary.com/image.jpg'
        })
      );
    });

    it('should return error when file upload fails', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequest = { requestId: 1, status: 'OPEN' };

      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      CustomizationResponse.findOne.mockResolvedValue(null);
      uploadBuffer.mockRejectedValue(new Error('Upload failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      req.body = {
        price: 100,
        notes: 'Test notes',
        estimationCompletionDate: '2025-12-31'
      };
      req.file = { buffer: Buffer.from('test image') };

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Image upload error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error uploading image' });

      consoleSpy.mockRestore();
    });

    it('should update existing declined response', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequest = { requestId: 1, status: 'OPEN', title: 'Test Request', customerId: 1 };
      const mockExistingResponse = {
        responseId: 1,
        status: 'DECLINED',
        price: 50,
        estimationCompletionTime: new Date('2025-11-30'),
        artistId: 1,
        requestId: 1,
        notes: 'Old notes',
        image: null,
        update: jest.fn().mockImplementation((data) => {
          Object.assign(mockExistingResponse, data);
          return Promise.resolve();
        }),
        updatedAt: new Date()
      };
      const mockCustomer = { customerId: 1, userId: 2, name: 'Customer' };
      const mockUser = { userId: 2, email: 'customer@test.com' };

      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      CustomizationResponse.findOne.mockResolvedValue(mockExistingResponse);
      Customer.findOne.mockResolvedValue(mockCustomer);
      User.findByPk.mockResolvedValue(mockUser);
      sendCustomizationResponseEmail.mockResolvedValue();

      req.body = {
        price: 150,
        notes: 'Updated notes',
        estimationCompletionDate: '2025-12-31'
      };

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(mockExistingResponse.update).toHaveBeenCalledWith({
        price: 150,
        notes: 'Updated notes',
        estimationCompletionTime: new Date('2025-12-31T00:00:00.000Z'),
        image: null,
        status: 'PENDING',
        updatedAt: expect.any(Date)
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Response updated successfully',
        response: expect.objectContaining({
          responseId: 1,
          status: 'PENDING',
          price: 150,
          notes: 'Updated notes'
        })
      });
    });

    it('should handle email sending failure gracefully', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequest = { requestId: 1, status: 'OPEN', customerId: 1 };
      const mockResponse = { responseId: 1, price: 100 };

      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      CustomizationResponse.findOne.mockResolvedValue(null);
      CustomizationResponse.create.mockResolvedValue(mockResponse);
      Customer.findOne.mockResolvedValue({ customerId: 1, userId: 2 });
      User.findByPk.mockResolvedValue({ userId: 2, email: 'test@test.com' });
      sendCustomizationResponseEmail.mockRejectedValue(new Error('Email failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      req.body = {
        price: 100,
        notes: 'Test notes',
        estimationCompletionDate: '2025-12-31'
      };

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error sending customization response email:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(201);

      consoleSpy.mockRestore();
    });

    it('should handle internal server error', async () => {
      validationResult.mockReturnValue({ isEmpty: () => false });
      Artist.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error in respondToCustomizationRequest:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getCustomizationResponses', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should return customer responses successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockResponses = [
        { responseId: 1, status: 'PENDING', price: 100 },
        { responseId: 2, status: 'ACCEPTED', price: 200 }
      ];

      Customer.findOne.mockResolvedValue(mockCustomer);
      getCustomerResponsesEnhanced.mockResolvedValue(mockResponses);

      await customizationResponseController.getCustomizationResponses(req, res);

      expect(getCustomerResponsesEnhanced).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        responses: mockResponses,
        total: 2
      });
    });

    it('should return message when no responses found', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      getCustomerResponsesEnhanced.mockResolvedValue([]);

      await customizationResponseController.getCustomizationResponses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        responses: [],
        total: 0,
        message: 'No responses found for your requests'
      });
    });

    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await customizationResponseController.getCustomizationResponses(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({
        message: 'You are not authorized to view customization responses'
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customizationResponseController.getCustomizationResponses(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error getting customer customization responses:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('acceptCustomizationResponse', () => {
    beforeEach(() => {
      req.user = { id: 1 };
      req.params = { responseId: '1' };
    });

    it('should accept response and create order successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockResponse = {
        responseId: 1,
        price: 100,
        status: 'PENDING',
        requestId: 1,
        artistId: 1,
        update: jest.fn().mockResolvedValue()
      };
      const mockRequest = {
        requestId: 1,
        customerId: 1,
        title: 'Test Request',
        requestDescription: 'Test description',
        image: 'test.jpg'
      };
      const mockOrder = { orderId: 1, totalAmount: 100 };
      const mockProduct = { productId: 1, name: 'Test Product' };

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationResponse.findOne.mockResolvedValue(mockResponse);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      Order.create.mockResolvedValue(mockOrder);
      Product.create.mockResolvedValue(mockProduct);
      Product_Order.create.mockResolvedValue({});
      CustomizationRequest.update.mockResolvedValue();
      autoDeclinePendingResponses.mockResolvedValue(2);

      await customizationResponseController.acceptCustomizationResponse(req, res);

      expect(mockResponse.update).toHaveBeenCalledWith({ status: 'ACCEPTED' });
      expect(Order.create).toHaveBeenCalledWith({
        totalAmount: 100,
        customerId: 1,
        createdAt: expect.any(Date)
      });
      expect(Product.create).toHaveBeenCalledWith({
        name: 'Test Request',
        price: 100,
        description: 'Test description',
        image: ['test.jpg'],
        quantity: 1,
        sellingNumber: 0,
        artistId: 1,
        type: 'customizable'
      });
      expect(autoDeclinePendingResponses).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'order has been created successfully, here we go',
        responseId: 1,
        status: 'ACCEPTED',
        autoDeclinedResponses: 2,
        order: mockOrder
      });
    });

    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await customizationResponseController.acceptCustomizationResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({
        message: 'You are not authorized to accept customization responses'
      });
    });

    it('should return 404 when response not found', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationResponse.findOne.mockResolvedValue(null);

      await customizationResponseController.acceptCustomizationResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Response not found'
      });
    });

    it('should return 500 when associated request not found', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockResponse = { responseId: 1, requestId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationResponse.findOne.mockResolvedValue(mockResponse);
      CustomizationRequest.findOne.mockResolvedValue(null);

      await customizationResponseController.acceptCustomizationResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Associated customization request not found'
      });
    });

    it('should return 403 when customer not authorized', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockResponse = { responseId: 1, requestId: 1 };
      const mockRequest = { requestId: 1, customerId: 2 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationResponse.findOne.mockResolvedValue(mockResponse);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);

      await customizationResponseController.acceptCustomizationResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({
        message: 'You are not authorized to accept this response'
      });
    });

    it('should return 400 when response already processed', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockResponse = { responseId: 1, status: 'ACCEPTED', requestId: 1 };
      const mockRequest = { requestId: 1, customerId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationResponse.findOne.mockResolvedValue(mockResponse);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);

      await customizationResponseController.acceptCustomizationResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Response has already been processed'
      });
    });

    it('should handle request without image', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockResponse = {
        responseId: 1,
        price: 100,
        status: 'PENDING',
        requestId: 1,
        artistId: 1,
        update: jest.fn().mockResolvedValue()
      };
      const mockRequest = {
        requestId: 1,
        customerId: 1,
        title: 'Test Request',
        requestDescription: 'Test description',
        image: null
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationResponse.findOne.mockResolvedValue(mockResponse);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      Order.create.mockResolvedValue({ orderId: 1 });
      Product.create.mockResolvedValue({ productId: 1 });
      Product_Order.create.mockResolvedValue({});
      CustomizationRequest.update.mockResolvedValue();
      autoDeclinePendingResponses.mockResolvedValue(0);

      await customizationResponseController.acceptCustomizationResponse(req, res);

      expect(Product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          image: []
        })
      );
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customizationResponseController.acceptCustomizationResponse(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error accepting customization response:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('declineCustomizationResponse', () => {
    beforeEach(() => {
      req.user = { id: 1 };
      req.params = { responseId: '1' };
    });

    it('should decline response successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockResponse = {
        responseId: 1,
        status: 'PENDING',
        requestId: 1,
        update: jest.fn().mockResolvedValue()
      };
      const mockRequest = { requestId: 1, customerId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationResponse.findOne.mockResolvedValue(mockResponse);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);

      await customizationResponseController.declineCustomizationResponse(req, res);

      expect(mockResponse.update).toHaveBeenCalledWith({ status: 'DECLINED' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Customization response declined successfully',
        responseId: 1,
        status: 'DECLINED'
      });
    });

    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await customizationResponseController.declineCustomizationResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({
        message: 'You are not authorized to decline customization responses'
      });
    });

    it('should return 404 when response not found', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationResponse.findOne.mockResolvedValue(null);

      await customizationResponseController.declineCustomizationResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Response not found'
      });
    });

    it('should return 400 when response already processed', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockResponse = { responseId: 1, status: 'DECLINED', requestId: 1 };
      const mockRequest = { requestId: 1, customerId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationResponse.findOne.mockResolvedValue(mockResponse);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);

      await customizationResponseController.declineCustomizationResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Response has already been processed'
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customizationResponseController.declineCustomizationResponse(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error declining customization response:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getArtistCustomizationResponses', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should return artist responses with statistics', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockResult = {
        responses: [
          { responseId: 1, status: 'PENDING' },
          { responseId: 2, status: 'ACCEPTED' },
          { responseId: 3, status: 'DECLINED' }
        ],
        autoDeclinedCount: 0
      };

      Artist.findOne.mockResolvedValue(mockArtist);
      getArtistResponsesEnhanced.mockResolvedValue(mockResult);

      await customizationResponseController.getArtistCustomizationResponses(req, res);

      expect(getArtistResponsesEnhanced).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        responses: mockResult.responses,
        total: 3,
        statistics: {
          pending: 1,
          accepted: 1,
          declined: 1
        }
      });
    });

    it('should include auto-declined message when applicable', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockResult = {
        responses: [],
        autoDeclinedCount: 2
      };

      Artist.findOne.mockResolvedValue(mockArtist);
      getArtistResponsesEnhanced.mockResolvedValue(mockResult);

      await customizationResponseController.getArtistCustomizationResponses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        responses: [],
        total: 0,
        statistics: {
          pending: 0,
          accepted: 0,
          declined: 0
        },
        message: '2 response(s) were automatically declined due to closed requests'
      });
    });

    it('should return 403 when artist not found', async () => {
      Artist.findOne.mockResolvedValue(null);

      await customizationResponseController.getArtistCustomizationResponses(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({
        message: 'You are not authorized to view customization responses'
      });
    });

    it('should handle internal server error', async () => {
      Artist.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customizationResponseController.getArtistCustomizationResponses(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error getting artist customization responses:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases and Additional Scenarios', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should handle missing customer when sending email in new response', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequest = { requestId: 1, status: 'OPEN', customerId: 1 };
      const mockResponse = { responseId: 1, price: 100 };

      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      CustomizationResponse.findOne.mockResolvedValue(null);
      CustomizationResponse.create.mockResolvedValue(mockResponse);
      Customer.findOne.mockResolvedValue(null);

      req.params = { requestId: '1' };
      req.body = {
        price: 100,
        notes: 'Test notes',
        estimationCompletionDate: '2025-12-31'
      };

      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-01T00:00:00.000Z').getTime());

      await customizationResponseController.getArtistCustomizationResponses(req, res);

      expect(sendCustomizationResponseEmail).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it('should handle missing user email when sending email', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequest = { requestId: 1, status: 'OPEN', customerId: 1 };
      const mockResponse = { responseId: 1, price: 100 };
      const mockCustomer = { customerId: 1, userId: 2 };
      const mockUser = { userId: 2, email: null };

      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      CustomizationResponse.findOne.mockResolvedValue(null);
      CustomizationResponse.create.mockResolvedValue(mockResponse);
      Customer.findOne.mockResolvedValue(mockCustomer);
      User.findByPk.mockResolvedValue(mockUser);

      req.params = { requestId: '1' };
      req.body = {
        price: 100,
        notes: 'Test notes',
        estimationCompletionDate: '2025-12-31'
      };

      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-01T00:00:00.000Z').getTime());

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(sendCustomizationResponseEmail).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);

      jest.restoreAllMocks();
    });

    it('should handle accepted status in existing response check', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequest = { requestId: 1, status: 'OPEN' };
      const mockExistingResponse = { responseId: 1, status: 'ACCEPTED' };

      validationResult.mockReturnValue({ isEmpty: () => true });
      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      CustomizationResponse.findOne.mockResolvedValue(mockExistingResponse);

      req.params = { requestId: '1' };

      await customizationResponseController.respondToCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You have already responded to this request',
        existingResponseId: 1,
        existingResponseStatus: 'ACCEPTED'
      });
    });
  });
});
