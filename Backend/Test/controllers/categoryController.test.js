jest.mock('../../src/models/category', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn()
}));
jest.mock('../../src/models/categoriesRequests', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn()
}));
jest.mock('../../src/models/artist', () => ({
  findOne: jest.fn()
}));
jest.mock('../../src/models/product', () => ({}));

jest.mock('sequelize', () => ({
  fn: jest.fn().mockReturnValue('mock_fn'),
  col: jest.fn().mockReturnValue('mock_col')
}));

const Category = require('../../src/models/category');
const categoryRequests = require('../../src/models/categoriesRequests');
const Artist = require('../../src/models/artist');
const categoryController = require('../../src/controllers/categoryController');

describe('Category Controller', () => {
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
  });

  describe('createCategory', () => {
    it('should create a new category successfully', async () => {
      const categoryData = { name: 'TestCategory' };
      req.body = categoryData;

      Category.findOne.mockResolvedValue(null);
      Category.create.mockResolvedValue({ categoryId: 1, name: 'TestCategory' });

      await categoryController.createCategory(req, res);

      expect(Category.findOne).toHaveBeenCalledWith({ where: { name: 'TestCategory' } });
      expect(Category.create).toHaveBeenCalledWith({ name: 'TestCategory' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        category: { categoryId: 1, name: 'TestCategory' }
      });
    });

    it('should return 400 if name is not provided', async () => {
      req.body = {};

      await categoryController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please provide all required fields'
      });
      expect(Category.findOne).not.toHaveBeenCalled();
      expect(Category.create).not.toHaveBeenCalled();
    });

    it('should return 400 if category already exists', async () => {
      req.body = { name: 'ExistingCategory' };

      Category.findOne.mockResolvedValue({ categoryId: 1, name: 'ExistingCategory' });

      await categoryController.createCategory(req, res);

      expect(Category.findOne).toHaveBeenCalledWith({ where: { name: 'ExistingCategory' } });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category "ExistingCategory" already exists'
      });
      expect(Category.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      req.body = { name: 'TestCategory' };

      Category.findOne.mockRejectedValue(new Error('Database connection failed'));

      await categoryController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Database connection failed'
      });
    });

    it('should handle creation errors', async () => {
      req.body = { name: 'TestCategory' };

      Category.findOne.mockResolvedValue(null);
      Category.create.mockRejectedValue(new Error('Creation failed'));

      await categoryController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Creation failed'
      });
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories with product counts', async () => {
      const mockCategories = [
        { categoryId: 1, name: 'Art', productCount: 5 },
        { categoryId: 2, name: 'Crafts', productCount: 3 }
      ];

      Category.findAll.mockResolvedValue(mockCategories);

      await categoryController.getAllCategories(req, res);

      expect(Category.findAll).toHaveBeenCalledWith({
        include: [{
          model: require('../../src/models/product'),
          attributes: [],
          required: false,
          where: {
            type: 'normal'
          }
        }],
        attributes: [
          'categoryId',
          'name',
          ['mock_fn', 'productCount']
        ],
        group: ['category.categoryId', 'category.name'],
        raw: true
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        categories: mockCategories
      });
    });

    it('should handle database errors', async () => {
      Category.findAll.mockRejectedValue(new Error('Database connection failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await categoryController.getAllCategories(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching categories:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Database connection failed'
      });

      consoleSpy.mockRestore();
    });

    it('should return empty array if no categories exist', async () => {
      Category.findAll.mockResolvedValue([]);

      await categoryController.getAllCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        categories: []
      });
    });
  });

  describe('requestCategory', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should create a new category request successfully', async () => {
      req.body = { name: 'NewCategory' };

      Artist.findOne.mockResolvedValue({ artistId: 1, userId: 1 });
      Category.findOne.mockResolvedValue(null);
      categoryRequests.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      categoryRequests.create.mockResolvedValue({
        id: 1,
        artistId: 1,
        name: 'NewCategory',
        status: 'pending',
        counter: 1
      });

      await categoryController.requestCategory(req, res);

      expect(Artist.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(Category.findOne).toHaveBeenCalledWith({ where: { name: 'NewCategory' } });
      expect(categoryRequests.findOne).toHaveBeenCalledWith({
        where: {
          artistId: 1,
          name: 'NewCategory'
        }
      });
      expect(categoryRequests.findOne).toHaveBeenCalledWith({
        where: { name: 'NewCategory' }
      });
      expect(categoryRequests.create).toHaveBeenCalledWith({
        artistId: 1,
        name: 'NewCategory',
        status: 'pending',
        counter: 1
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category request for "NewCategory" received'
      });
    });

    it('should return 400 if name is not provided', async () => {
      req.body = {};

      await categoryController.requestCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please provide a category name'
      });
      expect(Artist.findOne).not.toHaveBeenCalled();
    });

    it('should return 404 if artist profile not found', async () => {
      req.body = { name: 'NewCategory' };

      Artist.findOne.mockResolvedValue(null);

      await categoryController.requestCategory(req, res);

      expect(Artist.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Artist profile not found. Please complete your artist profile first.'
      });
    });

    it('should return 400 if category already exists', async () => {
      req.body = { name: 'ExistingCategory' };

      Artist.findOne.mockResolvedValue({ artistId: 1, userId: 1 });
      Category.findOne.mockResolvedValue({ categoryId: 1, name: 'ExistingCategory' });

      await categoryController.requestCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category "ExistingCategory" already exists'
      });
    });

    it('should return 400 if artist already requested this category', async () => {
      req.body = { name: 'RequestedCategory' };

      Artist.findOne.mockResolvedValue({ artistId: 1, userId: 1 });
      Category.findOne.mockResolvedValue(null);
      categoryRequests.findOne.mockResolvedValueOnce({
        id: 1,
        artistId: 1,
        name: 'RequestedCategory'
      });

      await categoryController.requestCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You already requested this category: "RequestedCategory"'
      });
    });

    it('should increment counter if another user already requested the category', async () => {
      req.body = { name: 'RequestedCategory' };

      Artist.findOne.mockResolvedValue({ artistId: 1, userId: 1 });
      Category.findOne.mockResolvedValue(null);
      categoryRequests.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 1,
          artistId: 2,
          name: 'RequestedCategory',
          counter: 1,
          save: jest.fn().mockResolvedValue()
        });

      await categoryController.requestCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category request for "RequestedCategory" updated. Counter incremented.'
      });
    });

    it('should handle database errors', async () => {
      req.body = { name: 'NewCategory' };

      Artist.findOne.mockRejectedValue(new Error('Database connection failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await categoryController.requestCategory(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error requesting category:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Database connection failed'
      });

      consoleSpy.mockRestore();
    });

    it('should handle save errors when incrementing counter', async () => {
      req.body = { name: 'RequestedCategory' };

      Artist.findOne.mockResolvedValue({ artistId: 1, userId: 1 });
      Category.findOne.mockResolvedValue(null);
      categoryRequests.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 1,
          artistId: 2,
          name: 'RequestedCategory',
          counter: 1,
          save: jest.fn().mockRejectedValue(new Error('Save failed'))
        });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await categoryController.requestCategory(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error requesting category:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Save failed'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('getRequestedCategories', () => {
    it('should return all requested categories ordered by counter', async () => {
      const mockRequestedCategories = [
        { name: 'PopularCategory', counter: 5, createdAt: '2023-01-01' },
        { name: 'LessPopularCategory', counter: 2, createdAt: '2023-01-02' }
      ];

      categoryRequests.findAll.mockResolvedValue(mockRequestedCategories);

      await categoryController.getRequestedCategories(req, res);

      expect(categoryRequests.findAll).toHaveBeenCalledWith({
        attributes: ['name', 'counter', 'createdAt'],
        order: [['counter', 'DESC']]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        requestedCategories: mockRequestedCategories
      });
    });

    it('should return empty array if no requested categories exist', async () => {
      categoryRequests.findAll.mockResolvedValue([]);

      await categoryController.getRequestedCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        requestedCategories: []
      });
    });

    it('should handle database errors', async () => {
      categoryRequests.findAll.mockRejectedValue(new Error('Database connection failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await categoryController.getRequestedCategories(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching requested categories:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Database connection failed'
      });

      consoleSpy.mockRestore();
    });

    it('should handle empty result gracefully', async () => {
      categoryRequests.findAll.mockResolvedValue(null);

      await categoryController.getRequestedCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        requestedCategories: null
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('should handle null/undefined category names in createCategory', async () => {
      req.body = { name: null };

      await categoryController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please provide all required fields'
      });
    });

    it('should handle empty string category names in createCategory', async () => {
      req.body = { name: '' };

      await categoryController.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please provide all required fields'
      });
    });

    it('should handle whitespace-only category names in requestCategory', async () => {
      req.body = { name: '   ' };

      Artist.findOne.mockResolvedValue({ artistId: 1, userId: 1 });
      Category.findOne.mockResolvedValue(null);
      categoryRequests.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      categoryRequests.create.mockResolvedValue({
        id: 1,
        artistId: 1,
        name: '   ',
        status: 'pending',
        counter: 1
      });

      await categoryController.requestCategory(req, res);

      expect(categoryRequests.create).toHaveBeenCalledWith({
        artistId: 1,
        name: '   ',
        status: 'pending',
        counter: 1
      });
    });

    it('should handle case sensitivity in category names', async () => {
      req.body = { name: 'TestCategory' };

      Category.findOne.mockResolvedValue(null);
      Category.create.mockResolvedValue({ categoryId: 1, name: 'TestCategory' });

      await categoryController.createCategory(req, res);

      expect(Category.findOne).toHaveBeenCalledWith({ where: { name: 'TestCategory' } });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle very long category names', async () => {
      const longName = 'A'.repeat(1000);
      req.body = { name: longName };

      Category.findOne.mockResolvedValue(null);
      Category.create.mockResolvedValue({ categoryId: 1, name: longName });

      await categoryController.createCategory(req, res);

      expect(Category.create).toHaveBeenCalledWith({ name: longName });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle special characters in category names', async () => {
      const specialName = 'Test@#$%^&*()Category';
      req.body = { name: specialName };

      Category.findOne.mockResolvedValue(null);
      Category.create.mockResolvedValue({ categoryId: 1, name: specialName });

      await categoryController.createCategory(req, res);

      expect(Category.create).toHaveBeenCalledWith({ name: specialName });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
