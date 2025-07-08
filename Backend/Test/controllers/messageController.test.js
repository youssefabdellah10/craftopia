jest.mock('../../src/models/message', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
}));
jest.mock('../../src/models/customizationRequest', () => ({
  findByPk: jest.fn()
}));
jest.mock('../../src/models/customizationResponse', () => ({
  findByPk: jest.fn()
}));
jest.mock('../../src/models/customer', () => ({
  findOne: jest.fn(),
  findByPk: jest.fn()
}));
jest.mock('../../src/models/artist', () => ({
  findOne: jest.fn(),
  findByPk: jest.fn()
}));
jest.mock('../../src/models/user', () => ({
  findByPk: jest.fn()
}));
jest.mock('../../src/utils/cloudinaryUpload', () => ({
  uploadBuffer: jest.fn()
}));
jest.mock('../../src/utils/validateMsg', () => ({
  validateMessageContent: jest.fn()
}));
jest.mock('../../src/services/socketService', () => ({
  isUserOnline: jest.fn(),
  sendToUser: jest.fn(),
  sendMessageStatusUpdate: jest.fn(),
  broadcastMessage: jest.fn()
}));
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const Message = require('../../src/models/message');
const CustomizationRequest = require('../../src/models/customizationRequest');
const CustomizationResponse = require('../../src/models/customizationResponse');
const Customer = require('../../src/models/customer');
const Artist = require('../../src/models/artist');
const User = require('../../src/models/user');
const { uploadBuffer } = require('../../src/utils/cloudinaryUpload');
const { validateMessageContent } = require('../../src/utils/validateMsg');
const socketService = require('../../src/services/socketService');
const { validationResult } = require('express-validator');
const messageController = require('../../src/controllers/messageController');

describe('Message Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: {},
      files: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    validationResult.mockReturnValue({ isEmpty: () => true });
    validateMessageContent.mockReturnValue({ isValid: true });
    socketService.isUserOnline.mockReturnValue(false);
    socketService.sendToUser.mockImplementation(() => {});
    socketService.sendMessageStatusUpdate.mockImplementation(() => {});
    socketService.broadcastMessage.mockImplementation(() => {});
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      req.params = { responseId: '1' };
      req.body = { messageContent: 'Test message' };
      req.user = { id: 1 };
    });

    it('should return validation errors when present', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'messageContent', message: 'Required' }]
      });

      await messageController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: [{ field: 'messageContent', message: 'Required' }]
      });
    });

    it('should return 400 when message content is empty', async () => {
      req.body.messageContent = '';

      await messageController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Message content is required'
      });
    });

    it('should return 404 when customization response not found', async () => {
      CustomizationResponse.findByPk.mockResolvedValue(null);

      await messageController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Customization response not found'
      });
    });

    it('should return 403 when response is not accepted', async () => {
      const mockResponse = { status: 'PENDING', requestId: 1, artistId: 2 };
      CustomizationResponse.findByPk.mockResolvedValue(mockResponse);

      await messageController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Messages can only be sent for accepted customization responses'
      });
    });

    it('should send message successfully for customer', async () => {
      const mockResponse = { status: 'ACCEPTED', requestId: 1, artistId: 2 };
      const mockRequest = { customerId: 1 };
      const mockUser = { role: 'customer' };
      const mockCustomer = { customerId: 1, userId: 1, name: 'Customer' };
      const mockArtist = { artistId: 2, userId: 3 };
      const mockMessage = {
        messageId: 1,
        toJSON: () => ({
          messageId: 1,
          messageContent: 'Test message'
        }),
        update: jest.fn().mockResolvedValue()
      };

      CustomizationResponse.findByPk.mockResolvedValue(mockResponse);
      CustomizationRequest.findByPk.mockResolvedValue(mockRequest);
      User.findByPk.mockResolvedValue(mockUser);
      Customer.findOne.mockResolvedValue(mockCustomer);
      Customer.findByPk.mockResolvedValue(mockCustomer);
      Artist.findByPk.mockResolvedValue(mockArtist);
      Message.create.mockResolvedValue(mockMessage);

      await messageController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Message sent successfully',
        data: expect.objectContaining({
          messageId: 1,
          senderName: 'Customer',
          isReceiverOnline: false,
          deliveryStatus: 'sent'
        })
      });
    });

    it('should handle internal server error', async () => {
      CustomizationResponse.findByPk.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await messageController.sendMessage(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error sending message:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('getUnreadMessages', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should return unread messages for customer', async () => {
      const mockUser = { role: 'customer' };
      const mockCustomer = { customerId: 1 };
      const mockMessages = [
        { messageId: 1, messageContent: 'Message 1' },
        { messageId: 2, messageContent: 'Message 2' }
      ];

      User.findByPk.mockResolvedValue(mockUser);
      Customer.findOne.mockResolvedValue(mockCustomer);
      Message.findAll.mockResolvedValue(mockMessages);
      Message.update.mockResolvedValue();

      await messageController.getUnreadMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unread messages retrieved successfully',
        data: {
          unreadMessages: mockMessages,
          unreadCount: 2
        }
      });
    });

    it('should return 404 when user profile not found', async () => {
      const mockUser = { role: 'customer' };
      User.findByPk.mockResolvedValue(mockUser);
      Customer.findOne.mockResolvedValue(null);

      await messageController.getUnreadMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User profile not found'
      });
    });

    it('should handle internal server error', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await messageController.getUnreadMessages(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error getting unread count:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('getMessagesByRespondId', () => {
    beforeEach(() => {
      req.params = { responseId: '1' };
      req.user = { id: 1 };
    });

    it('should return messages for authorized user', async () => {
      const mockUser = { role: 'customer' };
      const mockCustomer = { customerId: 1 };
      const mockMessages = [
        { 
          messageId: 1, 
          messageContent: 'Message 1',
          senderId: 1,
          senderType: 'customer',
          toJSON: () => ({ messageId: 1, messageContent: 'Message 1' })
        }
      ];

      User.findByPk.mockResolvedValue(mockUser);
      Customer.findOne.mockResolvedValue(mockCustomer);
      Customer.findByPk.mockResolvedValue({ name: 'Customer' });
      Message.findAll.mockResolvedValue(mockMessages);

      await messageController.getMessagesByRespondId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Messages retrieved successfully',
        data: {
          messages: expect.any(Array),
          messageCount: 1
        }
      });
    });

    it('should return 404 when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await messageController.getMessagesByRespondId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });

    it('should handle internal server error', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await messageController.getMessagesByRespondId(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error getting messages by response ID:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('markMessageAsRead', () => {
    beforeEach(() => {
      req.params = { messageId: '1' };
      req.user = { id: 1 };
    });

    it('should mark message as read successfully', async () => {
      const mockMessage = {
        messageId: 1,
        receiverId: 1,
        receiverType: 'customer',
        senderId: 2,
        senderType: 'artist',
        isRead: false,
        update: jest.fn().mockResolvedValue()
      };
      const mockUser = { role: 'customer' };
      const mockCustomer = { customerId: 1 };

      Message.findByPk.mockResolvedValue(mockMessage);
      User.findByPk.mockResolvedValue(mockUser);
      Customer.findOne.mockResolvedValue(mockCustomer);
      Artist.findByPk.mockResolvedValue({ userId: 3 });

      await messageController.markMessageAsRead(req, res);

      expect(mockMessage.update).toHaveBeenCalledWith({ 
        isRead: true,
        readAt: expect.any(Date),
        deliveryStatus: 'read'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Message marked as read',
        data: mockMessage
      });
    });

    it('should return 404 when message not found', async () => {
      Message.findByPk.mockResolvedValue(null);

      await messageController.markMessageAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Message not found'
      });
    });

    it('should handle internal server error', async () => {
      Message.findByPk.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await messageController.markMessageAsRead(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error marking message as read:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });

      consoleSpy.mockRestore();
    });
  });
});