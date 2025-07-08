const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/upload');
const productController = require('../controllers/productController');
const { body, param, query } = require('express-validator');

router.post('/create', 
    authMiddleware,
    roleMiddleware(['artist', 'admin']),
    upload.array('image', 5),
    [
        body('name').notEmpty().withMessage('Product name is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('categoryId').isInt().withMessage('Category ID must be an integer'),
        body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
        body('dimensions').optional().isString().withMessage('Dimensions must be a string'),
        body('material').optional().isString().withMessage('Material must be a string'),
        body('type').isIn(['auction', 'normal','customizable']).optional().withMessage('Type must be one of: auction, normal, customizable'),
    ],  
    productController.createProduct
);

router.get('/get', 
    [
        query('type').optional().isIn(['auction', 'normal', 'customizable']).withMessage('Type must be one of: auction, normal, customizable'),
    ]
    ,productController.getProducts);

router.put('/update/:productId',
    authMiddleware,
    roleMiddleware(['artist', 'admin']),
    [
        param('productId').isInt().withMessage('Product ID must be an integer'),
        body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
        body('description').optional().notEmpty().withMessage('Description cannot be empty'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
        body('dimensions').optional().isString().withMessage('Dimensions must be a string'),
        body('material').optional().isString().withMessage('Material must be a string')
    ],
    productController.updateProduct
);

router.get('/get/:artistId',
    [
        param('productId').isInt().withMessage('Product ID must be an integer')
    ],
    productController.getArtistProducts
);

router.delete('/delete/:productId',
    authMiddleware,
    roleMiddleware(['artist', 'admin']),
    [
        param('productId').isInt().withMessage('Product ID must be an integer')
    ],
    productController.deleteProduct
);

module.exports = router;