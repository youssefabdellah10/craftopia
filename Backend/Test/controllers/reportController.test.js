jest.mock('../../src/models', () => ({
  Report: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  Artist: {
    findOne: jest.fn()
  },
  Customer: {
    findOne: jest.fn()
  },
  User: {
    findOne: jest.fn()
  }
}));

jest.mock('../../src/utils/cloudinaryUpload', () => jest.fn());

jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const { Report, Artist, Customer, User } = require('../../src/models');
const uploadBuffer = require('../../src/utils/cloudinaryUpload');
const { validationResult } = require('express-validator');
const reportController = require('../../src/controllers/reportController');

describe('Report Controller', () => {
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
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    validationResult.mockReturnValue({ isEmpty: () => true });
    uploadBuffer.mockResolvedValue({ secure_url: 'https://example.com/image.jpg' });
  });

  describe('createReportUser', () => {
    beforeEach(() => {
      req.body = { content: 'Report content' };
      req.params = { username: 'reporteduser' };
      req.user = { id: 1, role: 'customer' };
    });

    it('should return validation errors when present', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'content', message: 'Content is required' }]
      });

      await reportController.createReportUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: [{ field: 'content', message: 'Content is required' }]
      });
    });

    it('should return 401 when user not authenticated', async () => {
      req.user = null;

      await reportController.createReportUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not authenticated'
      });
    });

    it('should return 400 when content or username missing', async () => {
      req.body.content = '';

      await reportController.createReportUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Content and reported username are required'
      });
    });

    it('should return 404 when customer profile not found for reporter', async () => {
      Customer.findOne.mockResolvedValueOnce(null);

      await reportController.createReportUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Customer profile not found'
      });
    });

    it('should return 404 when reported customer not found', async () => {
      const mockReporter = { customerId: 1, username: 'reporter' };
      Customer.findOne.mockResolvedValueOnce(mockReporter);
      Customer.findOne.mockResolvedValueOnce(null);

      await reportController.createReportUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Reported customer not found'
      });
    });

    it('should return 400 when trying to report yourself', async () => {
      const mockReporter = { customerId: 1, username: 'sameuser' };
      const mockReported = { customerId: 1, username: 'sameuser' };
      
      Customer.findOne.mockResolvedValueOnce(mockReporter);
      Customer.findOne.mockResolvedValueOnce(mockReported);

      await reportController.createReportUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot report yourself'
      });
    });

    it('should create report successfully for customer reporting another customer', async () => {
      const mockReporter = { customerId: 1, username: 'reporter' };
      const mockReported = { customerId: 2, username: 'reporteduser' };
      const mockReport = { ReportId: 1, content: 'Report content' };

      Customer.findOne.mockResolvedValueOnce(mockReporter);
      Customer.findOne.mockResolvedValueOnce(mockReported);
      Report.create.mockResolvedValue(mockReport);

      await reportController.createReportUser(req, res);

      expect(Report.create).toHaveBeenCalledWith({
        content: 'Report content',
        ReporterID: 1,
        reporterusername: 'reporter',
        ReporterType: 'customer',
        ReportedID: 2,
        reportedusername: 'reporteduser',
        ReportedType: 'customer',
        attachmentUrl: ''
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Report created successfully',
        data: mockReport
      });
    });

    it('should create report successfully for artist reporting customer', async () => {
      req.user.role = 'artist';
      const mockArtist = { artistId: 1, username: 'artistuser' };
      const mockReported = { customerId: 2, username: 'reporteduser' };
      const mockReport = { ReportId: 1, content: 'Report content' };

      Artist.findOne.mockResolvedValue(mockArtist);
      Customer.findOne.mockResolvedValue(mockReported);
      Report.create.mockResolvedValue(mockReport);

      await reportController.createReportUser(req, res);

      expect(Report.create).toHaveBeenCalledWith({
        content: 'Report content',
        ReporterID: 1,
        reporterusername: 'artistuser',
        ReporterType: 'artist',
        ReportedID: 2,
        reportedusername: 'reporteduser',
        ReportedType: 'customer',
        attachmentUrl: ''
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 403 for invalid user role', async () => {
      req.user.role = 'admin';

      await reportController.createReportUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only artists and customers can create reports'
      });
    });

    it('should handle file attachment upload', async () => {
      const mockReporter = { customerId: 1, username: 'reporter' };
      const mockReported = { customerId: 2, username: 'reporteduser' };
      const mockReport = { ReportId: 1, content: 'Report content' };

      req.files = {
        attachment: [{
          buffer: Buffer.from('test'),
          mimetype: 'image/jpeg'
        }]
      };

      Customer.findOne.mockResolvedValueOnce(mockReporter);
      Customer.findOne.mockResolvedValueOnce(mockReported);
      Report.create.mockResolvedValue(mockReport);

      await reportController.createReportUser(req, res);

      expect(uploadBuffer).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 for invalid file type', async () => {
      const mockReporter = { customerId: 1, username: 'reporter' };
      const mockReported = { customerId: 2, username: 'reported' };

      req.files = {
        attachment: [{
          buffer: Buffer.from('test'),
          mimetype: 'application/pdf'
        }]
      };

      Customer.findOne
        .mockResolvedValueOnce(mockReporter)
        .mockResolvedValueOnce(mockReported);

      await reportController.createReportUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Only image files are allowed as attachments'
      });
    });

    it('should handle internal server error', async () => {
      Customer.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await reportController.createReportUser(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error creating report:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Database error'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('createReportArtist', () => {
    beforeEach(() => {
      req.body = { content: 'Report content' };
      req.params = { username: 'reportedartist' };
      req.user = { id: 1, role: 'customer' };
    });

    it('should create report successfully for customer reporting artist', async () => {
      const mockReporter = { customerId: 1, username: 'reporter' };
      const mockReported = { artistId: 2, username: 'reportedartist' };
      const mockReport = { ReportId: 1, content: 'Report content' };

      Customer.findOne.mockResolvedValue(mockReporter);
      Artist.findOne.mockResolvedValue(mockReported);
      Report.create.mockResolvedValue(mockReport);

      await reportController.createReportArtist(req, res);

      expect(Report.create).toHaveBeenCalledWith({
        content: 'Report content',
        ReporterID: 1,
        ReporterType: 'customer',
        ReportedID: 2,
        ReportedType: 'artist',
        attachmentUrl: '',
        reportedusername: 'reportedartist',
        reporterusername: 'reporter'
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 404 when reported artist not found', async () => {
      const mockReporter = { customerId: 1, username: 'reporter' };
      Customer.findOne.mockResolvedValue(mockReporter);
      Artist.findOne.mockResolvedValue(null);

      await reportController.createReportArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Reported artist not found'
      });
    });

    it('should return 400 when artist tries to report themselves', async () => {
      req.user.role = 'artist';
      const mockArtist = { artistId: 1, username: 'sameartist' };
      const mockReported = { artistId: 1, username: 'sameartist' };
      
      Artist.findOne.mockResolvedValueOnce(mockArtist);
      Artist.findOne.mockResolvedValueOnce(mockReported);

      await reportController.createReportArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot report yourself'
      });
    });
  });

  describe('getAllSubmittedReports', () => {
    beforeEach(() => {
      req.user = { id: 1, role: 'admin' };
    });

    it('should return 403 for non-admin users', async () => {
      req.user.role = 'customer';

      await reportController.getAllSubmittedReports(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only admins can access this resource'
      });
    });

    it('should return submitted reports successfully', async () => {
      const mockReports = [
        { ReportId: 1, status: 'submitted' },
        { ReportId: 2, status: 'submitted' }
      ];

      Report.findAll.mockResolvedValue(mockReports);

      await reportController.getAllSubmittedReports(req, res);

      expect(Report.findAll).toHaveBeenCalledWith({
        where: { status: 'submitted' }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReports
      });
    });

    it('should handle internal server error', async () => {
      Report.findAll.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await reportController.getAllSubmittedReports(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching reports:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);

      consoleSpy.mockRestore();
    });
  });

  describe('getAllReviewedReports', () => {
    beforeEach(() => {
      req.user = { id: 1, role: 'admin' };
    });

    it('should return reviewed reports successfully', async () => {
      const mockReports = [
        { ReportId: 1, status: 'reviewed' },
        { ReportId: 2, status: 'reviewed' }
      ];

      Report.findAll.mockResolvedValue(mockReports);

      await reportController.getAllReviewedReports(req, res);

      expect(Report.findAll).toHaveBeenCalledWith({
        where: { status: 'reviewed' }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReports
      });
    });
  });

  describe('getReportbyId', () => {
    beforeEach(() => {
      req.params = { id: '1' };
      req.user = { id: 1, role: 'admin' };
    });

    it('should return 400 for invalid report ID', async () => {
      req.params.id = 'invalid';

      await reportController.getReportbyId(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid report ID. Must be a valid integer.'
      });
    });

    it('should return 403 for non-admin users', async () => {
      req.user.role = 'customer';

      await reportController.getReportbyId(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only admins can access this resource'
      });
    });

    it('should return 404 when report not found', async () => {
      Report.findOne.mockResolvedValue(null);

      await reportController.getReportbyId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Report not found'
      });
    });

    it('should return report successfully', async () => {
      const mockReport = { ReportId: 1, content: 'Report content' };
      Report.findOne.mockResolvedValue(mockReport);

      await reportController.getReportbyId(req, res);

      expect(Report.findOne).toHaveBeenCalledWith({
        where: { ReportId: '1' }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReport
      });
    });
  });

  describe('ReviewReport', () => {
    beforeEach(() => {
      req.params = { id: '1' };
      req.user = { id: 1, role: 'admin' };
    });

    it('should return 400 for invalid report ID', async () => {
      req.params.id = 'invalid';

      await reportController.ReviewReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid report ID. Must be a valid integer.'
      });
    });

    it('should return 403 for non-admin users', async () => {
      req.user.role = 'customer';

      await reportController.ReviewReport(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only admins can reviwew reports'
      });
    });

    it('should return 404 when report not found', async () => {
      Report.findOne.mockResolvedValue(null);

      await reportController.ReviewReport(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Report not found'
      });
    });

    it('should return 400 when report already reviewed', async () => {
      const mockReport = {
        ReportId: 1,
        status: 'reviewed',
        adminReviwerId: 2
      };
      const mockAdmin = { email: 'admin@example.com' };

      Report.findOne.mockResolvedValue(mockReport);
      User.findOne.mockResolvedValue(mockAdmin);

      await reportController.ReviewReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Report is already reviewed before by an admin with email: admin@example.com'
      });
    });

    it('should review report successfully', async () => {
      const mockReport = {
        ReportId: 1,
        status: 'submitted',
        save: jest.fn().mockResolvedValue()
      };

      Report.findOne.mockResolvedValue(mockReport);

      await reportController.ReviewReport(req, res);

      expect(mockReport.status).toBe('reviewed');
      expect(mockReport.adminReviwerId).toBe(1);
      expect(mockReport.reviewedAt).toBeInstanceOf(Date);
      expect(mockReport.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Report reviewed successfully',
        data: mockReport
      });
    });
  });

  describe('BanUser', () => {
    beforeEach(() => {
      req.params = { id: '2' };
      req.user = { id: 1, role: 'admin' };
    });

    it('should return 400 for invalid user ID', async () => {
      req.params.id = 'invalid';

      await reportController.BanUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid user ID. Must be a valid integer.'
      });
    });

    it('should return 403 for non-admin users', async () => {
      req.user.role = 'customer';

      await reportController.BanUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only admins can ban users'
      });
    });

    it('should return 404 when user not found', async () => {
      User.findOne.mockResolvedValue(null);

      await reportController.BanUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('should ban user successfully', async () => {
      const mockUser = {
        userId: 2,
        role: 'customer',
        isBanned: false,
        save: jest.fn().mockResolvedValue()
      };

      User.findOne.mockResolvedValue(mockUser);

      await reportController.BanUser(req, res);

      expect(mockUser.isBanned).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User banned successfully',
        data: mockUser
      });
    });

    it('should return 400 when trying to ban yourself', async () => {
      req.params = { id: '1' };  // Same as req.user.id

      const mockUser = {
        userId: 1,
        role: 'admin',
        isBanned: false
      };

      User.findOne.mockResolvedValue(mockUser);

      await reportController.BanUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You cannot ban yourself'
      });
    });

    it('should return 403 when trying to ban an admin user', async () => {
      const mockUser = {
        userId: 2,
        role: 'admin',
        isBanned: false
      };

      User.findOne.mockResolvedValue(mockUser);

      await reportController.BanUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You cannot ban an admin user'
      });
    });
  });

  describe('UnbanUser', () => {
    beforeEach(() => {
      req.params = { id: '1' };
      req.user = { id: 1, role: 'admin' };
    });

    it('should unban user successfully', async () => {
      const mockUser = {
        userId: 1,
        isBanned: true,
        save: jest.fn().mockResolvedValue()
      };

      User.findOne.mockResolvedValue(mockUser);

      await reportController.UnbanUser(req, res);

      expect(mockUser.isBanned).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User unbanned successfully',
        data: mockUser
      });
    });

    it('should return 403 for non-admin users', async () => {
      req.user.role = 'customer';

      await reportController.UnbanUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only admins can unban users'
      });
    });
  });
});
