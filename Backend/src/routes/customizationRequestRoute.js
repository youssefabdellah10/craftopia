const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const customizationRequestController = require('../controllers/customizationRequestController');
const upload = require('../middlewares/upload');
const { body, param } = require('express-validator');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validateDeadline } = require('../utils/dateValidation');

router.post('/request', 
    authMiddleware,
    upload.single('image'),
    [
        body('description').notEmpty().withMessage('Description is required'),
        body('budget').isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
        body('deadline').custom(validateDeadline)
    ],
    customizationRequestController.createCustomizationRequest
);

router.get('/requests', authMiddleware, customizationRequestController.getOpenCustomizationRequests);

router.get('/customer/requests', authMiddleware, roleMiddleware('customer'), customizationRequestController.getCustomerCustomizationRequests);

router.get('/noOffers', 
    authMiddleware, 
    roleMiddleware('customer'), 
    customizationRequestController.getCustomerCustomizationRequestswithnoOffers
);

router.put('/close/:requestId',
    authMiddleware,
    roleMiddleware('customer'),
    [
        param('requestId').isInt().withMessage('Request ID must be an integer')
    ],
    customizationRequestController.closeCustomizationRequest
);

module.exports = router;