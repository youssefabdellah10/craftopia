const router = require('express').Router();
const auctionRequestController = require('../controllers/auctionRequestController');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validateAuctionStartDate } = require('../utils/dateValidation');

router.post('/create', 
    authMiddleware,
    roleMiddleware('artist'),
    [
        body('productId').isInt().withMessage('Product ID must be an integer'),
        body('startingPrice').isFloat({ min: 0 }).withMessage('Starting price must be a positive number'),
        body('Duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer (hours)'),
        body('notes').optional().isString().withMessage('Notes must be a string')
    ],
    auctionRequestController.createAuctionRequest
);

router.get('/my-requests', 
    authMiddleware,
    roleMiddleware('artist'),
    auctionRequestController.getMyAuctionRequests
);

router.get('/all', 
    authMiddleware,
    // roleMiddleware('admin'),
    [
        query('status').optional().isIn(['pending', 'rejected', 'scheduled']).withMessage('Status must be pending, rejected, or scheduled')
    ],
    auctionRequestController.getAllAuctionRequests
);

router.post('/schedule/:requestId', 
    authMiddleware,
    roleMiddleware('admin'),
    [
        param('requestId').isInt().withMessage('Request ID must be an integer'),
        body('startDate').custom(validateAuctionStartDate),
        body('Duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer (hours)'),
        body('adminNotes').optional().isString().withMessage('Admin notes must be a string')
    ],
    auctionRequestController.approveAndScheduleAuction
);

router.post('/reject/:requestId', 
    authMiddleware,
    roleMiddleware('admin'),
    [
        param('requestId').isInt().withMessage('Request ID must be an integer'),
        body('adminNotes').optional().isString().withMessage('Admin notes must be a string')
    ],
    auctionRequestController.rejectAuctionRequest
);

module.exports = router;