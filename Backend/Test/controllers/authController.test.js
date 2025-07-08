jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn()
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));
jest.mock('../../src/models/user', () => ({
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn()
}));
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));
jest.mock('../../src/utils/otpUtils', () => ({
  createAndSendOTP: jest.fn(),
  verifyOTP: jest.fn()
}));

const authController = require('../../src/controllers/authController');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/user');
const { validationResult } = require('express-validator');
const { createAndSendOTP, verifyOTP } = require('../../src/utils/otpUtils');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('register', () => {
    it('should return validation errors when present', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ field: 'email', message: 'Invalid email' }])
      };
      validationResult.mockReturnValue(mockErrors);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        errors: [{ field: 'email', message: 'Invalid email' }] 
      });
    });

    it('should return 400 when user already exists', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        email: 'test@example.com',
        password: 'password123',
        role: 'customer'
      };

      const existingUser = { userId: 1, email: 'test@example.com' };
      User.findOne.mockResolvedValue(existingUser);

      await authController.register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
    });

    it('should return 500 when OTP sending fails', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        email: 'test@example.com',
        password: 'password123',
        role: 'customer'
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt123');
      bcrypt.hash.mockResolvedValue('hashedPassword123');

      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        role: 'customer',
        destroy: jest.fn().mockResolvedValue()
      };
      User.create.mockResolvedValue(mockUser);

      createAndSendOTP.mockResolvedValue({ success: false });

      await authController.register(req, res);

      expect(mockUser.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to send verification email. Please try again.'
      });
    });

    it('should register user successfully for customer', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        email: 'test@example.com',
        password: 'password123',
        role: 'customer'
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt123');
      bcrypt.hash.mockResolvedValue('hashedPassword123');

      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        role: 'customer'
      };
      User.create.mockResolvedValue(mockUser);

      createAndSendOTP.mockResolvedValue({ success: true });

      await authController.register(req, res);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt123');
      expect(User.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'customer',
        isEmailVerified: false
      });
      expect(createAndSendOTP).toHaveBeenCalledWith(1, 'test@example.com', 'Customer');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Registration successful! Please check your email for verification code.',
        userId: 1,
        email: 'test@example.com',
        role: 'customer',
        requiresEmailVerification: true
      });
    });

    it('should register user successfully for artist', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        email: 'artist@example.com',
        password: 'password123',
        role: 'artist'
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt123');
      bcrypt.hash.mockResolvedValue('hashedPassword123');

      const mockUser = {
        userId: 2,
        email: 'artist@example.com',
        role: 'artist'
      };
      User.create.mockResolvedValue(mockUser);

      createAndSendOTP.mockResolvedValue({ success: true });

      await authController.register(req, res);

      expect(createAndSendOTP).toHaveBeenCalledWith(2, 'artist@example.com', 'Artist');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Registration successful! Please check your email for verification code.',
        userId: 2,
        email: 'artist@example.com',
        role: 'artist',
        requiresEmailVerification: true
      });
    });

    it('should prevent admin registration', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Admin registration is not allowed through public signup'
      });
      expect(User.findOne).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should handle internal server error', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        email: 'test@example.com',
        password: 'password123',
        role: 'customer'
      };

      User.findOne.mockRejectedValue(new Error('Database error'));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('login', () => {
    it('should return validation errors when present', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ field: 'email', message: 'Invalid email' }])
      };
      validationResult.mockReturnValue(mockErrors);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        errors: [{ field: 'email', message: 'Invalid email' }] 
      });
    });

    it('should return 404 when user not found', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue(null);

      await authController.login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 401 when password is invalid', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'customer',
        isEmailVerified: true,
        isBanned: false
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword123');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should return 403 when user is banned', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'customer',
        isEmailVerified: true,
        isBanned: true
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Your account has been banned. Please contact support.' 
      });
    });

    it('should login successfully', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'customer',
        isEmailVerified: true,
        isBanned: false
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token123');

      await authController.login(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, role: 'customer', email: 'test@example.com' },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'token123',
        userId: 1,
        role: 'customer',
        email: 'test@example.com'
      });
    });

    it('should handle internal server error', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      User.findOne.mockRejectedValue(new Error('Database error'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('verifyEmail', () => {
    it('should return validation errors when present', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ field: 'userId', message: 'User ID required' }])
      };
      validationResult.mockReturnValue(mockErrors);

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        errors: [{ field: 'userId', message: 'User ID required' }] 
      });
    });

    it('should return 404 when user not found', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        userId: 999,
        otpCode: '123456'
      };

      User.findByPk.mockResolvedValue(null);

      await authController.verifyEmail(req, res);

      expect(User.findByPk).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 400 when email already verified', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        userId: 1,
        otpCode: '123456'
      };

      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        isEmailVerified: true
      };
      User.findByPk.mockResolvedValue(mockUser);

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already verified' });
    });

    it('should return 400 when OTP verification fails', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        userId: 1,
        otpCode: '123456'
      };

      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        isEmailVerified: false
      };
      User.findByPk.mockResolvedValue(mockUser);
      verifyOTP.mockResolvedValue({ success: false, message: 'Invalid OTP code' });

      await authController.verifyEmail(req, res);

      expect(verifyOTP).toHaveBeenCalledWith(1, '123456');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid OTP code' });
    });

    it('should verify email successfully', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        userId: 1,
        otpCode: '123456'
      };

      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        isEmailVerified: false,
        update: jest.fn().mockResolvedValue()
      };
      User.findByPk.mockResolvedValue(mockUser);
      verifyOTP.mockResolvedValue({ success: true });

      await authController.verifyEmail(req, res);

      expect(mockUser.update).toHaveBeenCalledWith({ isEmailVerified: true });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email verified successfully! You can now login.',
        isEmailVerified: true
      });
    });

    it('should handle internal server error', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        userId: 1,
        otpCode: '123456'
      };

      User.findByPk.mockRejectedValue(new Error('Database error'));

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('resendOTP', () => {
    it('should return validation errors when present', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ field: 'userId', message: 'User ID required' }])
      };
      validationResult.mockReturnValue(mockErrors);

      await authController.resendOTP(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        errors: [{ field: 'userId', message: 'User ID required' }] 
      });
    });

    it('should return 404 when user not found', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        userId: 999
      };

      User.findByPk.mockResolvedValue(null);

      await authController.resendOTP(req, res);

      expect(User.findByPk).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 400 when email already verified', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        userId: 1
      };

      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        role: 'customer',
        isEmailVerified: true
      };
      User.findByPk.mockResolvedValue(mockUser);

      await authController.resendOTP(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already verified' });
    });

    it('should return 500 when OTP sending fails', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        userId: 1
      };

      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        role: 'customer',
        isEmailVerified: false
      };
      User.findByPk.mockResolvedValue(mockUser);
      createAndSendOTP.mockResolvedValue({ success: false });

      await authController.resendOTP(req, res);

      expect(createAndSendOTP).toHaveBeenCalledWith(1, 'test@example.com', 'Customer');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to send verification email' });
    });

    it('should resend OTP successfully for customer', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        userId: 1
      };

      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        role: 'customer',
        isEmailVerified: false
      };
      User.findByPk.mockResolvedValue(mockUser);
      createAndSendOTP.mockResolvedValue({ success: true });

      await authController.resendOTP(req, res);

      expect(createAndSendOTP).toHaveBeenCalledWith(1, 'test@example.com', 'Customer');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'New verification code sent to your email'
      });
    });

    it('should resend OTP successfully for artist', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        userId: 2
      };

      const mockUser = {
        userId: 2,
        email: 'artist@example.com',
        role: 'artist',
        isEmailVerified: false
      };
      User.findByPk.mockResolvedValue(mockUser);
      createAndSendOTP.mockResolvedValue({ success: true });

      await authController.resendOTP(req, res);

      expect(createAndSendOTP).toHaveBeenCalledWith(2, 'artist@example.com', 'Artist');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle internal server error', async () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true)
      };
      validationResult.mockReturnValue(mockErrors);

      req.body = {
        userId: 1
      };

      User.findByPk.mockRejectedValue(new Error('Database error'));

      await authController.resendOTP(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});
