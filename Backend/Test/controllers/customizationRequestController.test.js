jest.mock('../../src/models/customizationRequest', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn()
}));
jest.mock('../../src/models/artist', () => ({
  findOne: jest.fn()
}));
jest.mock('../../src/models/customer', () => ({
  findOne: jest.fn()
}));
jest.mock('../../src/models/customizationResponse', () => ({}));
jest.mock('../../src/models/user', () => ({
  findByPk: jest.fn()
}));
jest.mock('../../src/utils/cloudinaryUpload', () => ({
  uploadBuffer: jest.fn()
}));
jest.mock('../../src/utils/customizationUtils', () => ({
  autoDeclinePendingResponses: jest.fn()
}));
jest.mock('../../src/utils/emailService', () => ({
  sendCustomizationRequestReceivedEmail: jest.fn()
}));
jest.mock('../../src/utils/dateValidation', () => ({
  validateDeadline: jest.fn()
}));

const CustomizationRequest = require('../../src/models/customizationRequest');
const Artist = require('../../src/models/artist');
const Customer = require('../../src/models/customer');
const CustomizationResponse = require('../../src/models/customizationResponse');
const User = require('../../src/models/user');
const { uploadBuffer } = require('../../src/utils/cloudinaryUpload');
const { autoDeclinePendingResponses } = require('../../src/utils/customizationUtils');
const { sendCustomizationRequestReceivedEmail } = require('../../src/utils/emailService');
const { validateDeadline } = require('../../src/utils/dateValidation');
const customizationRequestController = require('../../src/controllers/customizationRequestController');

describe('Customization Request Controller', () => {
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

  describe('createCustomizationRequest', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should create customization request successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1, name: 'John Doe' };
      const mockUser = { userId: 1, email: 'john@example.com' };
      const mockRequest = {
        requestId: 1,
        title: 'Test Request',
        requestDescription: 'Test description',
        budget: 100,
        deadline: new Date('2025-12-31T00:00:00.000Z'),
        customerId: 1,
        status: 'OPEN'
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      validateDeadline.mockReturnValue(true);
      CustomizationRequest.create.mockResolvedValue(mockRequest);
      User.findByPk.mockResolvedValue(mockUser);
      sendCustomizationRequestReceivedEmail.mockResolvedValue();

      req.body = {
        description: 'Test description',
        budget: 100,
        title: 'Test Request',
        deadline: '2025-12-31'
      };

      await customizationRequestController.createCustomizationRequest(req, res);

      expect(Customer.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(validateDeadline).toHaveBeenCalledWith('2025-12-31');
      expect(CustomizationRequest.create).toHaveBeenCalledWith({
        requestDescription: 'Test description',
        budget: 100,
        title: 'Test Request',
        deadline: new Date('2025-12-31T00:00:00.000Z'),
        image: null,
        customerId: 1,
        status: 'OPEN'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Customization request created successfully',
        request: mockRequest
      });
    });

    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      req.body = {
        description: 'Test description',
        budget: 100,
        title: 'Test Request',
        deadline: '2025-12-31'
      };

      await customizationRequestController.createCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You are not authorized to create a customization request'
      });
    });

    it('should return 400 when required fields are missing', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      Customer.findOne.mockResolvedValue(mockCustomer);

      req.body = { description: 'Test description' };

      await customizationRequestController.createCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please provide all required fields',
        required: ['description', 'budget', 'title', 'deadline']
      });
    });

    it('should return 400 when deadline validation fails', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      Customer.findOne.mockResolvedValue(mockCustomer);
      validateDeadline.mockImplementation(() => {
        throw new Error('Invalid deadline');
      });

      req.body = {
        description: 'Test description',
        budget: 100,
        title: 'Test Request',
        deadline: 'invalid-date'
      };

      await customizationRequestController.createCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid deadline'
      });
    });

    it('should handle file upload successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1, name: 'John Doe' };
      const mockUser = { userId: 1, email: 'john@example.com' };
      const mockRequest = {
        requestId: 1,
        title: 'Test Request',
        requestDescription: 'Test description',
        budget: 100,
        image: 'https://cloudinary.com/image.jpg'
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      validateDeadline.mockReturnValue(true);
      uploadBuffer.mockResolvedValue({ secure_url: 'https://cloudinary.com/image.jpg' });
      CustomizationRequest.create.mockResolvedValue(mockRequest);
      User.findByPk.mockResolvedValue(mockUser);
      sendCustomizationRequestReceivedEmail.mockResolvedValue();

      req.body = {
        description: 'Test description',
        budget: 100,
        title: 'Test Request',
        deadline: '2025-12-31'
      };
      req.file = {
        buffer: Buffer.from('test image data')
      };

      await customizationRequestController.createCustomizationRequest(req, res);

      expect(uploadBuffer).toHaveBeenCalledWith(req.file.buffer, {
        folder: 'customers/1/customizationRequests',
        resource_type: 'image'
      });
      expect(CustomizationRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          image: 'https://cloudinary.com/image.jpg'
        })
      );
    });

    it('should continue without image when upload fails', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockRequest = { requestId: 1, image: null };

      Customer.findOne.mockResolvedValue(mockCustomer);
      validateDeadline.mockReturnValue(true);
      uploadBuffer.mockRejectedValue(new Error('Upload failed'));
      CustomizationRequest.create.mockResolvedValue(mockRequest);
      User.findByPk.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      req.body = {
        description: 'Test description',
        budget: 100,
        title: 'Test Request',
        deadline: '2025-12-31'
      };
      req.file = { buffer: Buffer.from('test') };

      await customizationRequestController.createCustomizationRequest(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Image upload error:', expect.any(Error));
      expect(consoleWarnSpy).toHaveBeenCalledWith('Continuing without image due to upload error');
      expect(res.status).toHaveBeenCalledWith(201);

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should handle email sending failure gracefully', async () => {
      const mockCustomer = { customerId: 1, userId: 1, name: 'John Doe' };
      const mockUser = { userId: 1, email: 'john@example.com' };
      const mockRequest = { requestId: 1, title: 'Test Request' };

      Customer.findOne.mockResolvedValue(mockCustomer);
      validateDeadline.mockReturnValue(true);
      CustomizationRequest.create.mockResolvedValue(mockRequest);
      User.findByPk.mockResolvedValue(mockUser);
      sendCustomizationRequestReceivedEmail.mockRejectedValue(new Error('Email failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      req.body = {
        description: 'Test description',
        budget: 100,
        title: 'Test Request',
        deadline: '2025-12-31'
      };

      await customizationRequestController.createCustomizationRequest(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error sending customization request email:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(201);

      consoleSpy.mockRestore();
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      req.body = {
        description: 'Test description',
        budget: 100,
        title: 'Test Request',
        deadline: '2025-12-31'
      };

      await customizationRequestController.createCustomizationRequest(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error creating customization request:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getOpenCustomizationRequests', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should return open customization requests for artist', async () => {
      const mockArtist = { artistId: 1, userId: 1 };
      const mockRequests = [
        { requestId: 1, status: 'OPEN', title: 'Request 1' },
        { requestId: 2, status: 'OPEN', title: 'Request 2' }
      ];

      Artist.findOne.mockResolvedValue(mockArtist);
      CustomizationRequest.findAll.mockResolvedValue(mockRequests);

      await customizationRequestController.getOpenCustomizationRequests(req, res);

      expect(Artist.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(CustomizationRequest.findAll).toHaveBeenCalledWith({ where: { status: 'OPEN' } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    it('should return 403 when artist not found', async () => {
      Artist.findOne.mockResolvedValue(null);

      await customizationRequestController.getOpenCustomizationRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({
        message: 'You are not authorized to view customization requests'
      });
    });

    it('should handle internal server error', async () => {
      Artist.findOne.mockRejectedValue(new Error('Database error'));

      await customizationRequestController.getOpenCustomizationRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('closeCustomizationRequest', () => {
    beforeEach(() => {
      req.user = { id: 1 };
      req.params = { requestId: '1' };
    });

    it('should close customization request successfully', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockRequest = {
        requestId: 1,
        status: 'OPEN',
        customerId: 1,
        update: jest.fn().mockResolvedValue()
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);
      autoDeclinePendingResponses.mockResolvedValue(3);

      await customizationRequestController.closeCustomizationRequest(req, res);

      expect(CustomizationRequest.findOne).toHaveBeenCalledWith({
        where: {
          requestId: '1',
          customerId: 1
        }
      });
      expect(mockRequest.update).toHaveBeenCalledWith({ status: 'CLOSED' });
      expect(autoDeclinePendingResponses).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Customization request closed successfully',
        requestId: 1,
        status: 'CLOSED',
        autoDeclinedResponses: 3
      });
    });

    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await customizationRequestController.closeCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({
        message: 'You are not authorized to close customization requests'
      });
    });

    it('should return 404 when request not found', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationRequest.findOne.mockResolvedValue(null);

      await customizationRequestController.closeCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Request not found or you are not authorized to close this request'
      });
    });

    it('should return 400 when request is already closed', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockRequest = {
        requestId: 1,
        status: 'CLOSED',
        customerId: 1
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationRequest.findOne.mockResolvedValue(mockRequest);

      await customizationRequestController.closeCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Request is already closed'
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customizationRequestController.closeCustomizationRequest(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error closing customization request:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getCustomerCustomizationRequests', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should return customer customization requests with responses', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockRequests = [
        {
          requestId: 1,
          title: 'Request 1',
          customerId: 1,
          customizationresponses: [
            {
              responseId: 1,
              status: 'PENDING',
              price: 100,
              createdAt: '2023-01-01',
              artist: {
                username: 'artist1',
                profilePicture: 'pic1.jpg'
              }
            }
          ]
        }
      ];

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationRequest.findAll.mockResolvedValue(mockRequests);

      await customizationRequestController.getCustomerCustomizationRequests(req, res);

      expect(CustomizationRequest.findAll).toHaveBeenCalledWith({
        where: { customerId: 1 },
        include: [
          {
            model: CustomizationResponse,
            attributes: ['responseId', 'status', 'price', 'createdAt'],
            include: [
              {
                model: Artist,
                attributes: ['username', 'profilePicture']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await customizationRequestController.getCustomerCustomizationRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({
        message: 'You are not authorized to view customization requests'
      });
    });

    it('should handle internal server error', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationRequest.findAll.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customizationRequestController.getCustomerCustomizationRequests(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error getting customer customization requests:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getCustomerCustomizationRequestswithnoOffers', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should return requests with no offers', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockRequests = [
        {
          requestId: 1,
          title: 'Request 1',
          customizationresponses: []
        },
        {
          requestId: 2,
          title: 'Request 2',
          CustomizationResponses: [{ responseId: 1 }]
        },
        {
          requestId: 3,
          title: 'Request 3',
          customizationResponses: []
        }
      ];

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationRequest.findAll.mockResolvedValue(mockRequests);

      await customizationRequestController.getCustomerCustomizationRequestswithnoOffers(req, res);

      expect(CustomizationRequest.findAll).toHaveBeenCalledWith({
        where: { customerId: 1 },
        include: [
          {
            model: CustomizationResponse,
            required: false
          }
        ]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        mockRequests[0],
        mockRequests[2]
      ]);
    });

    it('should return requests with null/undefined responses', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockRequests = [
        {
          requestId: 1,
          title: 'Request 1',
          customizationresponses: null
        },
        {
          requestId: 2,
          title: 'Request 2'
        }
      ];

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationRequest.findAll.mockResolvedValue(mockRequests);

      await customizationRequestController.getCustomerCustomizationRequestswithnoOffers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    it('should return 403 when customer not found', async () => {
      Customer.findOne.mockResolvedValue(null);

      await customizationRequestController.getCustomerCustomizationRequestswithnoOffers(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({
        message: 'You are not authorized to view customization requests'
      });
    });

    it('should handle internal server error', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationRequest.findAll.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await customizationRequestController.getCustomerCustomizationRequestswithnoOffers(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error getting customer customization requests:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'Internal server error' });

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases and Additional Scenarios', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should handle missing user in email sending', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockRequest = { requestId: 1, title: 'Test Request' };

      Customer.findOne.mockResolvedValue(mockCustomer);
      validateDeadline.mockReturnValue(true);
      CustomizationRequest.create.mockResolvedValue(mockRequest);
      User.findByPk.mockResolvedValue(null);

      req.body = {
        description: 'Test description',
        budget: 100,
        title: 'Test Request',
        deadline: '2025-12-31'
      };

      await customizationRequestController.createCustomizationRequest(req, res);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(sendCustomizationRequestReceivedEmail).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle user without email', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockUser = { userId: 1, email: null };
      const mockRequest = { requestId: 1, title: 'Test Request' };

      Customer.findOne.mockResolvedValue(mockCustomer);
      validateDeadline.mockReturnValue(true);
      CustomizationRequest.create.mockResolvedValue(mockRequest);
      User.findByPk.mockResolvedValue(mockUser);

      req.body = {
        description: 'Test description',
        budget: 100,
        title: 'Test Request',
        deadline: '2025-12-31'
      };

      await customizationRequestController.createCustomizationRequest(req, res);

      expect(sendCustomizationRequestReceivedEmail).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle zero budget in createCustomizationRequest', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };

      Customer.findOne.mockResolvedValue(mockCustomer);

      req.body = {
        description: 'Test description',
        budget: 0,
        title: 'Test Request',
        deadline: '2025-12-31'
      };

      await customizationRequestController.createCustomizationRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please provide all required fields',
        required: ['description', 'budget', 'title', 'deadline']
      });
    });

    it('should handle requests with mixed response property names', async () => {
      const mockCustomer = { customerId: 1, userId: 1 };
      const mockRequests = [
        {
          requestId: 1,
          customizationresponses: [{ responseId: 1 }]
        },
        {
          requestId: 2,
          CustomizationResponses: []
        },
        {
          requestId: 3,
          customizationResponses: null
        }
      ];

      Customer.findOne.mockResolvedValue(mockCustomer);
      CustomizationRequest.findAll.mockResolvedValue(mockRequests);

      await customizationRequestController.getCustomerCustomizationRequestswithnoOffers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([mockRequests[1], mockRequests[2]]);
    });
  });
});
