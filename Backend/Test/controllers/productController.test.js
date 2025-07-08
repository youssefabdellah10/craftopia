const productController = require('../../src/controllers/productController');
const Product = require('../../src/models/product');
const Category = require('../../src/models/category');
const Artist = require('../../src/models/artist');
const Review = require('../../src/models/Review');
const AuctionRequest = require('../../src/models/auctionRequest');
const { uploadBuffer, deleteImagesByPublicIds } = require('../../src/utils/cloudinaryUpload');
const { Sequelize } = require('sequelize');

jest.mock('../../src/models/product', () => ({
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
}));
jest.mock('../../src/models/category', () => ({
    findOne: jest.fn()
}));
jest.mock('../../src/models/artist', () => ({
    findOne: jest.fn(),
    findByPk: jest.fn()
}));
jest.mock('../../src/models/Review', () => ({
    findOne: jest.fn()
}));
jest.mock('../../src/models/auctionRequest', () => ({
    findOne: jest.fn()
}));
jest.mock('../../src/models', () => ({
    Admin: {
        findOne: jest.fn()
    }
}));
jest.mock('../../src/utils/cloudinaryUpload', () => ({
    uploadBuffer: jest.fn(),
    deleteImagesByPublicIds: jest.fn()
}));
jest.mock('sequelize');

describe('Product Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 1 },
            body: {},
            params: {},
            query: {},
            files: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('createProduct', () => {
        beforeEach(() => {
            req.body = {
                name: 'Test Product',
                description: 'Test Description',
                price: 100,
                categoryName: 'Test Category',
                quantity: 10,
                dimension: '10x10',
                material: 'Wood',
                type: 'normal'
            };
            req.files = [
                { buffer: Buffer.from('image1') },
                { buffer: Buffer.from('image2') }
            ];
        });

        it('should successfully create a product', async () => {
            const mockArtist = { artistId: 1, userId: 1 };
            const mockCategory = { categoryId: 1, name: 'Test Category' };
            const mockProduct = {
                productId: 1,
                name: 'Test Product',
                description: 'Test Description',
                price: 100,
                image: ['image1.jpg', 'image2.jpg'],
                categoryId: 1,
                artistId: 1,
                quantity: 10,
                dimensions: '10x10',
                material: 'Wood',
                type: 'normal'
            };

            Artist.findOne.mockResolvedValue(mockArtist);
            Category.findOne.mockResolvedValue(mockCategory);
            uploadBuffer.mockResolvedValue({ secure_url: 'image1.jpg' });
            Product.create.mockResolvedValue(mockProduct);

            await productController.createProduct(req, res);

            expect(Artist.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
            expect(uploadBuffer).toHaveBeenCalledTimes(2);
            expect(Category.findOne).toHaveBeenCalledWith({ where: { name: 'Test Category' } });
            expect(Product.create).toHaveBeenCalledWith({
                name: 'Test Product',
                description: 'Test Description',
                price: 100,
                image: ['image1.jpg', 'image1.jpg'],
                categoryId: 1,
                artistId: 1,
                quantity: 10,
                dimensions: '10x10',
                material: 'Wood',
                type: 'normal'
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ product: mockProduct });
        });

        it('should return 403 if artist not found', async () => {
            Artist.findOne.mockResolvedValue(null);

            await productController.createProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'You are not authorized to create a product' });
        });

        it('should return 400 if required fields are missing', async () => {
            const mockArtist = { artistId: 1, userId: 1 };
            Artist.findOne.mockResolvedValue(mockArtist);

            req.body = { name: 'Test Product' }; // Missing required fields

            await productController.createProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Please provide all required fields',
                required: ['name', 'description', 'price', 'categoryName', 'quantity']
            });
        });

        it('should return 400 if no images provided', async () => {
            const mockArtist = { artistId: 1, userId: 1 };
            Artist.findOne.mockResolvedValue(mockArtist);

            req.files = null;

            await productController.createProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Please provide at least one image' });
        });

        it('should return 400 if too many images provided', async () => {
            const mockArtist = { artistId: 1, userId: 1 };
            Artist.findOne.mockResolvedValue(mockArtist);

            req.files = new Array(6).fill({ buffer: Buffer.from('image') });

            await productController.createProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'You can only upload a maximum of 5 images' });
        });

        it('should return 400 if category does not exist', async () => {
            const mockArtist = { artistId: 1, userId: 1 };
            Artist.findOne.mockResolvedValue(mockArtist);
            Category.findOne.mockResolvedValue(null);
            uploadBuffer.mockResolvedValue({ secure_url: 'image1.jpg' });

            await productController.createProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Category does not exist' });
        });

        it('should set quantity to 1 for customizable products', async () => {
            const mockArtist = { artistId: 1, userId: 1 };
            const mockCategory = { categoryId: 1, name: 'Test Category' };
            const mockProduct = { productId: 1 };

            req.body.type = 'customizable';
            req.body.quantity = 10;

            Artist.findOne.mockResolvedValue(mockArtist);
            Category.findOne.mockResolvedValue(mockCategory);
            uploadBuffer.mockResolvedValue({ secure_url: 'image1.jpg' });
            Product.create.mockResolvedValue(mockProduct);

            await productController.createProduct(req, res);

            expect(Product.create).toHaveBeenCalledWith(
                expect.objectContaining({ quantity: 1 })
            );
        });

        it('should set quantity to 1 for auction products', async () => {
            const mockArtist = { artistId: 1, userId: 1 };
            const mockCategory = { categoryId: 1, name: 'Test Category' };
            const mockProduct = { productId: 1 };

            req.body.type = 'auction';
            req.body.quantity = 10;

            Artist.findOne.mockResolvedValue(mockArtist);
            Category.findOne.mockResolvedValue(mockCategory);
            uploadBuffer.mockResolvedValue({ secure_url: 'image1.jpg' });
            Product.create.mockResolvedValue(mockProduct);

            await productController.createProduct(req, res);

            expect(Product.create).toHaveBeenCalledWith(
                expect.objectContaining({ quantity: 1 })
            );
        });

        it('should return 500 on internal server error', async () => {
            Artist.findOne.mockRejectedValue(new Error('Database error'));

            console.error = jest.fn();

            await productController.createProduct(req, res);

            expect(console.error).toHaveBeenCalledWith('Error creating product:', expect.any(Error));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });

    describe('getProducts', () => {
        it('should successfully get all products', async () => {
            const mockProducts = [
                {
                    productId: 1,
                    name: 'Product 1',
                    type: 'normal',
                    toJSON: () => ({ productId: 1, name: 'Product 1', type: 'normal' })
                },
                {
                    productId: 2,
                    name: 'Product 2',
                    type: 'auction',
                    toJSON: () => ({ productId: 2, name: 'Product 2', type: 'auction' })
                }
            ];
            const mockAuctionRequest = { productId: 2, status: 'scheduled' };
            const mockReviewStats = { totalReviews: '5', averageRating: 4.5 };

            Product.findAll.mockResolvedValue(mockProducts);
            AuctionRequest.findOne.mockResolvedValue(mockAuctionRequest);
            Review.findOne.mockResolvedValue(mockReviewStats);

            await productController.getProducts(req, res);

            expect(Product.findAll).toHaveBeenCalledWith({
                where: {},
                include: [
                    { model: Category, attributes: ['name'] },
                    { model: Artist, attributes: ['artistId', 'name'] }
                ],
                attributes: ['productId', 'name', 'price', 'description', 'image', 'sellingNumber', 'quantity', 'dimensions', 'material', 'createdAt', 'type']
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                products: expect.arrayContaining([
                    expect.objectContaining({
                        productId: 1,
                        totalReviews: 5,
                        averageRating: '4.50'
                    }),
                    expect.objectContaining({
                        productId: 2,
                        totalReviews: 5,
                        averageRating: '4.50'
                    })
                ]),
                totalProducts: 2
            });
        });

        it('should filter products by type', async () => {
            req.query = { type: 'normal' };
            const mockProducts = [];

            Product.findAll.mockResolvedValue(mockProducts);

            await productController.getProducts(req, res);

            expect(Product.findAll).toHaveBeenCalledWith({
                where: { type: 'normal' },
                include: expect.any(Array),
                attributes: expect.any(Array)
            });
        });

        it('should exclude auction products without scheduled requests', async () => {
            const mockProducts = [
                {
                    productId: 1,
                    type: 'auction',
                    toJSON: () => ({ productId: 1, type: 'auction' })
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);
            AuctionRequest.findOne.mockResolvedValue(null);
            Review.findOne.mockResolvedValue({ totalReviews: '0', averageRating: null });

            await productController.getProducts(req, res);

            expect(res.json).toHaveBeenCalledWith({
                products: [],
                totalProducts: 0
            });
        });

        it('should handle review stats with null values', async () => {
            const mockProducts = [
                {
                    productId: 1,
                    type: 'normal',
                    toJSON: () => ({ productId: 1, type: 'normal' })
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);
            Review.findOne.mockResolvedValue({ totalReviews: '0', averageRating: null });

            await productController.getProducts(req, res);

            expect(res.json).toHaveBeenCalledWith({
                products: [{
                    productId: 1,
                    type: 'normal',
                    totalReviews: 0,
                    averageRating: null
                }],
                totalProducts: 1
            });
        });

        it('should return 500 on internal server error', async () => {
            Product.findAll.mockRejectedValue(new Error('Database error'));

            await productController.getProducts(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
        });
    });

    describe('updateProduct', () => {
        beforeEach(() => {
            req.params = { productId: 1 };
            req.body = {
                name: 'Updated Product',
                description: 'Updated Description',
                price: 150,
                quantity: 15,
                dimensions: '15x15',
                material: 'Updated Material'
            };
        });

        it('should successfully update a product', async () => {
            const mockArtist = { artistId: 1, userId: 1 };
            const mockProduct = {
                productId: 1,
                artistId: 1,
                name: 'Old Product',
                description: 'Old Description',
                price: 100,
                quantity: 10,
                dimensions: '10x10',
                material: 'Old Material',
                type: 'normal',
                save: jest.fn().mockResolvedValue()
            };

            Artist.findOne.mockResolvedValue(mockArtist);
            Product.findOne.mockResolvedValue(mockProduct);

            await productController.updateProduct(req, res);

            expect(Artist.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
            expect(Product.findOne).toHaveBeenCalledWith({ where: { productId: 1 } });
            expect(mockProduct.name).toBe('Updated Product');
            expect(mockProduct.description).toBe('Updated Description');
            expect(mockProduct.price).toBe(150);
            expect(mockProduct.quantity).toBe(15);
            expect(mockProduct.dimensions).toBe('15x15');
            expect(mockProduct.material).toBe('Updated Material');
            expect(mockProduct.save).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ product: mockProduct });
        });

        it('should update product with new image', async () => {
            const mockArtist = { artistId: 1, userId: 1 };
            const mockProduct = {
                productId: 1,
                artistId: 1,
                name: 'Old Product',
                description: 'Old Description',
                price: 100,
                quantity: 10,
                dimensions: '10x10',
                material: 'Old Material',
                type: 'normal',
                image: 'old-image.jpg',
                save: jest.fn().mockResolvedValue()
            };

            req.files = {
                image: [{ buffer: Buffer.from('new-image') }]
            };

            Artist.findOne.mockResolvedValue(mockArtist);
            Product.findOne.mockResolvedValue(mockProduct);
            uploadBuffer.mockResolvedValue({ secure_url: 'new-image.jpg' });

            await productController.updateProduct(req, res);

            expect(uploadBuffer).toHaveBeenCalledWith(
                expect.any(Buffer),
                {
                    folder: 'artists/1/products',
                    resource_type: 'image'
                }
            );
            expect(mockProduct.image).toBe('new-image.jpg');
            expect(mockProduct.save).toHaveBeenCalledTimes(2);
        });

        it('should return 400 if artist not found', async () => {
            Artist.findOne.mockResolvedValue(null);

            await productController.updateProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'You are not authorized to update a product' });
        });

        it('should return 404 if product not found', async () => {
            const mockArtist = { artistId: 1, userId: 1 };
            Artist.findOne.mockResolvedValue(mockArtist);
            Product.findOne.mockResolvedValue(null);

            await productController.updateProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
        });

        it('should return 403 if artist does not own the product', async () => {
            const mockArtist = { artistId: 1, userId: 1 };
            const mockProduct = { productId: 1, artistId: 2 };

            Artist.findOne.mockResolvedValue(mockArtist);
            Product.findOne.mockResolvedValue(mockProduct);

            await productController.updateProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
        });

        it('should return 500 on internal server error', async () => {
            Artist.findOne.mockRejectedValue(new Error('Database error'));

            await productController.updateProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
        });
    });

    describe('getArtistProducts', () => {
        beforeEach(() => {
            req.params = { artistId: 1 };
        });

        it('should successfully get artist products with categorization', async () => {
            const mockArtist = { artistId: 1 };
            const mockProducts = [
                {
                    productId: 1,
                    type: 'normal',
                    toJSON: () => ({ productId: 1, type: 'normal' })
                },
                {
                    productId: 2,
                    type: 'auction',
                    toJSON: () => ({ productId: 2, type: 'auction' })
                },
                {
                    productId: 3,
                    type: 'customizable',
                    toJSON: () => ({ productId: 3, type: 'customizable' })
                }
            ];
            const mockAuctionRequest = { productId: 2 };
            const mockReviewStats = { totalReviews: '2', averageRating: 4.0 };

            Artist.findOne.mockResolvedValue(mockArtist);
            Product.findAll.mockResolvedValue(mockProducts);
            AuctionRequest.findOne.mockResolvedValue(mockAuctionRequest);
            Review.findOne.mockResolvedValue(mockReviewStats);

            await productController.getArtistProducts(req, res);

            expect(Artist.findOne).toHaveBeenCalledWith({ where: { artistId: 1 } });
            expect(Product.findAll).toHaveBeenCalledWith({
                where: { artistId: 1 },
                attributes: ['productId', 'name', 'price', 'description', 'image', 'quantity', 'dimensions', 'material', 'type'],
                include: [{ model: Category, attributes: ['categoryId', 'name'] }]
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                products: expect.arrayContaining([
                    expect.objectContaining({ productId: 1, totalReviews: 2, averageRating: '4.00' })
                ]),
                auctionProducts: expect.arrayContaining([
                    expect.objectContaining({ productId: 2, totalReviews: 2, averageRating: '4.00' })
                ]),
                customizableProducts: expect.arrayContaining([
                    expect.objectContaining({ productId: 3, totalReviews: 2, averageRating: '4.00' })
                ])
            });
        });

        it('should return 403 if artist not found', async () => {
            Artist.findOne.mockResolvedValue(null);

            await productController.getArtistProducts(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Artist not found' });
        });

        it('should categorize auction products without auction request as normal', async () => {
            const mockArtist = { artistId: 1 };
            const mockProducts = [
                {
                    productId: 1,
                    type: 'auction',
                    toJSON: () => ({ productId: 1, type: 'auction' })
                }
            ];

            Artist.findOne.mockResolvedValue(mockArtist);
            Product.findAll.mockResolvedValue(mockProducts);
            AuctionRequest.findOne.mockResolvedValue(null);
            Review.findOne.mockResolvedValue({ totalReviews: '0', averageRating: null });

            await productController.getArtistProducts(req, res);

            expect(res.json).toHaveBeenCalledWith({
                products: expect.arrayContaining([
                    expect.objectContaining({ productId: 1, totalReviews: 0, averageRating: null })
                ]),
                auctionProducts: [],
                customizableProducts: []
            });
        });

        it('should return 500 on internal server error', async () => {
            Artist.findOne.mockRejectedValue(new Error('Database error'));

            await productController.getArtistProducts(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
        });
    });

    describe('deleteProduct', () => {
        beforeEach(() => {
            req.params = { productId: 1 };
        });

        it('should successfully delete a product as artist', async () => {
            const { Admin } = require('../../src/models');
            const mockArtist = { artistId: 1, userId: 1 };
            const mockProduct = {
                productId: 1,
                artistId: 1,
                type: 'normal',
                image: ['image1.jpg', 'image2.jpg'],
                destroy: jest.fn().mockResolvedValue()
            };

            Artist.findOne.mockResolvedValue(mockArtist);
            Admin.findOne.mockResolvedValue(null);
            Product.findOne.mockResolvedValue(mockProduct);
            deleteImagesByPublicIds.mockResolvedValue({ success: true });

            await productController.deleteProduct(req, res);

            expect(Artist.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
            expect(Product.findOne).toHaveBeenCalledWith({ where: { productId: 1 } });
            expect(deleteImagesByPublicIds).toHaveBeenCalledWith(1, ['image1.jpg', 'image2.jpg']);
            expect(mockProduct.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product deleted successfully' });
        });

        it('should successfully delete a product as admin', async () => {
            const { Admin } = require('../../src/models');
            const mockAdmin = { adminId: 1, userId: 1 };
            const mockProduct = {
                productId: 1,
                artistId: 2,
                type: 'normal',
                image: [],
                destroy: jest.fn().mockResolvedValue()
            };

            Artist.findOne.mockResolvedValue(null);
            Admin.findOne.mockResolvedValue(mockAdmin);
            Product.findOne.mockResolvedValue(mockProduct);

            await productController.deleteProduct(req, res);

            expect(mockProduct.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product deleted successfully' });
        });

        it('should return 403 if user is not artist or admin', async () => {
            const { Admin } = require('../../src/models');
            Artist.findOne.mockResolvedValue(null);
            Admin.findOne.mockResolvedValue(null);

            await productController.deleteProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'You are not authorized to delete a product' });
        });

        it('should return 404 if product not found', async () => {
            const { Admin } = require('../../src/models');
            const mockArtist = { artistId: 1, userId: 1 };
            Artist.findOne.mockResolvedValue(mockArtist);
            Admin.findOne.mockResolvedValue(null);
            Product.findOne.mockResolvedValue(null);

            await productController.deleteProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
        });

        it('should return 403 if artist tries to delete another artist\'s product', async () => {
            const { Admin } = require('../../src/models');
            const mockArtist = { artistId: 1, userId: 1 };
            const mockProduct = { productId: 1, artistId: 2, type: 'normal' };

            Artist.findOne.mockResolvedValue(mockArtist);
            Admin.findOne.mockResolvedValue(null);
            Product.findOne.mockResolvedValue(mockProduct);

            await productController.deleteProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: You can only delete your own products' });
        });

        it('should return 400 if trying to delete non-normal product', async () => {
            const { Admin } = require('../../src/models');
            const mockArtist = { artistId: 1, userId: 1 };
            const mockProduct = { productId: 1, artistId: 1, type: 'auction' };

            Artist.findOne.mockResolvedValue(mockArtist);
            Admin.findOne.mockResolvedValue(null);
            Product.findOne.mockResolvedValue(mockProduct);

            await productController.deleteProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Cannot delete auction products. Only normal products can be deleted.'
            });
        });

        it('should handle Cloudinary deletion failure gracefully', async () => {
            const { Admin } = require('../../src/models');
            const mockArtist = { artistId: 1, userId: 1 };
            const mockProduct = {
                productId: 1,
                artistId: 1,
                type: 'normal',
                image: ['image1.jpg'],
                destroy: jest.fn().mockResolvedValue()
            };

            Artist.findOne.mockResolvedValue(mockArtist);
            Admin.findOne.mockResolvedValue(null);
            Product.findOne.mockResolvedValue(mockProduct);
            deleteImagesByPublicIds.mockResolvedValue({ success: false, error: 'Cloudinary error' });

            console.error = jest.fn();

            await productController.deleteProduct(req, res);

            expect(console.error).toHaveBeenCalledWith('Failed to delete images from Cloudinary:', 'Cloudinary error');
            expect(mockProduct.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 500 on internal server error', async () => {
            Artist.findOne.mockRejectedValue(new Error('Database error'));

            await productController.deleteProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
        });
    });
});
