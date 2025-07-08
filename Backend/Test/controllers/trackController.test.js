jest.mock('../../src/models/artist');
jest.mock('../../src/models/sales');

const trackController = require('../../src/controllers/trackController');
const Artist = require('../../src/models/artist');
const Sales = require('../../src/models/sales');

describe('Track Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 1, role: 'admin' },
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe('getArtistSalesByUsername', () => {
    beforeEach(() => {
      req.params = { username: 'artist123' };
    });

    it('should return 400 when username is not provided', async () => {
      req.params = {};

      await trackController.getArtistSalesByUsername(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Username is required'
      });
    });

    it('should return 400 when username is empty', async () => {
      req.params = { username: '' };

      await trackController.getArtistSalesByUsername(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Username is required'
      });
    });

    it('should return 404 when artist not found', async () => {
      Artist.findOne.mockResolvedValue(null);

      await trackController.getArtistSalesByUsername(req, res);

      expect(Artist.findOne).toHaveBeenCalledWith({
        where: { username: 'artist123' },
        attributes: ['username', 'sales']
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Artist not found'
      });
    });

    it('should return artist sales successfully', async () => {
      const mockArtist = {
        username: 'artist123',
        sales: 150.50
      };

      Artist.findOne.mockResolvedValue(mockArtist);

      await trackController.getArtistSalesByUsername(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Artist sales retrieved successfully',
        username: 'artist123',
        sales: 150.50
      });
    });

    it('should handle internal server error', async () => {
      Artist.findOne.mockRejectedValue(new Error('Database error'));

      await trackController.getArtistSalesByUsername(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
        error: 'Database error'
      });
    });
  });

  describe('getallSales', () => {
    it('should return all artist sales successfully', async () => {
      const mockSales = [
        { username: 'artist1', sales: 100.00 },
        { username: 'artist2', sales: 250.75 },
        { username: 'artist3', sales: 0.00 }
      ];

      Artist.findAll.mockResolvedValue(mockSales);

      await trackController.getallSales(req, res);

      expect(Artist.findAll).toHaveBeenCalledWith({
        attributes: ['username', 'sales']
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'All artist sales retrieved successfully',
        data: mockSales
      });
    });

    it('should return empty array when no artists found', async () => {
      Artist.findAll.mockResolvedValue([]);

      await trackController.getallSales(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'All artist sales retrieved successfully',
        data: []
      });
    });

    it('should handle internal server error', async () => {
      Artist.findAll.mockRejectedValue(new Error('Database connection failed'));

      await trackController.getallSales(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
        error: 'Database connection failed'
      });
    });
  });

  describe('getSalesHistory', () => {
    it('should return sales history successfully', async () => {
      const mockSalesHistory = [
        {
          id: 1,
          amount: 50.00,
          date: '2024-01-01',
          artist: {
            username: 'artist1',
            name: 'John Artist'
          }
        },
        {
          id: 2,
          amount: 75.50,
          date: '2024-01-02',
          artist: {
            username: 'artist2',
            name: 'Jane Artist'
          }
        }
      ];

      Sales.findAll.mockResolvedValue(mockSalesHistory);

      await trackController.getSalesHistory(req, res);

      expect(Sales.findAll).toHaveBeenCalledWith({
        include: [{
          model: Artist,
          as: 'artist',
          attributes: ['username', 'name']
        }]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sales history retrieved successfully',
        data: mockSalesHistory
      });
    });

    it('should return empty array when no sales history found', async () => {
      Sales.findAll.mockResolvedValue([]);

      await trackController.getSalesHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sales history retrieved successfully',
        data: []
      });
    });

    it('should handle internal server error', async () => {
      Sales.findAll.mockRejectedValue(new Error('Query timeout'));

      await trackController.getSalesHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
        error: 'Query timeout'
      });
    });
  });

  describe('getSalesByArtist', () => {
    beforeEach(() => {
      req.params = { artistId: '1' };
      req.user = { id: 1, role: 'admin' };
    });

    it('should return 400 when artistId is not provided', async () => {
      req.params = {};

      await trackController.getSalesByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Artist ID is required'
      });
    });

    it('should return 400 when artistId is empty', async () => {
      req.params = { artistId: '' };

      await trackController.getSalesByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Artist ID is required'
      });
    });

    it('should return 400 when artistId is not a number', async () => {
      req.params = { artistId: 'abc' };

      await trackController.getSalesByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Artist ID must be a number'
      });
    });

    it('should return 403 when artist tries to access another artist\'s sales', async () => {
      req.user = { id: 2, role: 'artist' };
      const mockArtist = { userId: 1, artistId: 1 };

      Artist.findByPk.mockResolvedValue(mockArtist);

      await trackController.getSalesByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden, you do not have permission to access this resource'
      });
    });

    it('should return 404 when no sales found for artist', async () => {
      const mockArtist = { userId: 1, artistId: 1 };

      Artist.findByPk.mockResolvedValue(mockArtist);
      Sales.findAll.mockResolvedValue([]);

      await trackController.getSalesByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No sales found for this artist'
      });
    });

    it('should return 404 when sales is null', async () => {
      const mockArtist = { userId: 1, artistId: 1 };

      Artist.findByPk.mockResolvedValue(mockArtist);
      Sales.findAll.mockResolvedValue(null);

      await trackController.getSalesByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No sales found for this artist'
      });
    });

    it('should return sales successfully for admin user', async () => {
      const mockArtist = { userId: 1, artistId: 1 };
      const mockSales = [
        {
          id: 1,
          amount: 100.00,
          artistId: 1,
          artist: {
            username: 'artist1',
            name: 'John Artist'
          }
        }
      ];

      Artist.findByPk.mockResolvedValue(mockArtist);
      Sales.findAll.mockResolvedValue(mockSales);

      await trackController.getSalesByArtist(req, res);

      expect(Sales.findAll).toHaveBeenCalledWith({
        where: { artistId: '1' },
        include: [{
          model: Artist,
          as: 'artist',
          attributes: ['username', 'name']
        }]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sales retrieved successfully',
        data: mockSales
      });
    });

    it('should return sales successfully for artist accessing own sales', async () => {
      req.user = { id: 1, role: 'artist' };
      const mockArtist = { userId: 1, artistId: 1 };
      const mockSales = [
        {
          id: 1,
          amount: 150.00,
          artistId: 1,
          artist: {
            username: 'artist1',
            name: 'John Artist'
          }
        }
      ];

      Artist.findByPk.mockResolvedValue(mockArtist);
      Sales.findAll.mockResolvedValue(mockSales);

      await trackController.getSalesByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sales retrieved successfully',
        data: mockSales
      });
    });

    it('should handle internal server error', async () => {
      Artist.findByPk.mockRejectedValue(new Error('Database error'));

      await trackController.getSalesByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
        error: 'Database error'
      });
    });

    it('should handle case when artist role with valid access but different artistId format', async () => {
      req.user = { id: 1, role: 'artist' };
      req.params = { artistId: '001' };
      const mockArtist = { userId: 1, artistId: 1 };
      const mockSales = [
        {
          id: 1,
          amount: 200.00,
          artistId: 1,
          artist: {
            username: 'artist1',
            name: 'John Artist'
          }
        }
      ];

      Artist.findByPk.mockResolvedValue(mockArtist);
      Sales.findAll.mockResolvedValue(mockSales);

      await trackController.getSalesByArtist(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sales retrieved successfully',
        data: mockSales
      });
    });
  });
});
