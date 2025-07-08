const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const customizationResponseController = require('../controllers/customizationResponseController');
const upload = require('../middlewares/upload');
const { body, param } = require('express-validator');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/responses', authMiddleware, customizationResponseController.getCustomizationResponses);

router.get('/artist/responses', authMiddleware, roleMiddleware('artist'), customizationResponseController.getArtistCustomizationResponses);

router.post('/respond/:requestId', 
    authMiddleware,
    roleMiddleware('artist'),
    upload.single('image'),
    [
        param('requestId').isInt().withMessage('Request ID must be an integer'),        
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('notes').notEmpty().withMessage('Notes are required'), 
        body('estimationCompletionDate').isISO8601().withMessage('Estimated completion date must be a valid date')
    ],
    customizationResponseController.respondToCustomizationRequest
);
router.put('/accept/:responseId',
    authMiddleware,
    roleMiddleware('customer'),
    [
        param('responseId').isInt().withMessage('Response ID must be an integer')
    ],
    customizationResponseController.acceptCustomizationResponse
);
router.put('/decline/:responseId',
    authMiddleware,
    roleMiddleware('customer'),
    [
        param('responseId').isInt().withMessage('Response ID must be an integer')
    ],
    customizationResponseController.declineCustomizationResponse
);

module.exports = router;