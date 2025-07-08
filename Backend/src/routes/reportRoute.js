const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const reportController = require('../controllers/reportController');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/upload');
const { body, param } = require('express-validator');

router.post('/createReportUser/:username', 
    authMiddleware,
    roleMiddleware(['artist', 'customer']),
    upload.fields([
        { name: 'attachment', maxCount: 2 }
    ]),
    [
        body('content').notEmpty().trim().withMessage('Report content is required'),
        param('username').isString().withMessage('Reported username must be a valid string'),
        body('attachment').optional().isString().withMessage('Attachment must be a string')
    ],
    reportController.createReportUser
);


router.post('/createReportArtist/:username', 
    authMiddleware,
    roleMiddleware(['artist', 'customer']),
    upload.fields([
        { name: 'attachment', maxCount: 2 }
    ]),
    [
        body('content').notEmpty().trim().withMessage('Report content is required'),
        param('username').isString().withMessage('Reported username must be a valid string'),
        body('attachment').optional().isString().withMessage('Attachment must be a string')
    ],
    reportController.createReportArtist
);


router.get('/submitted', 
    authMiddleware,
    roleMiddleware('admin'),
    reportController.getAllSubmittedReports
);


router.get('/reviewed', 
    authMiddleware,
    roleMiddleware('admin'),
    reportController.getAllReviewedReports
);

router.get('/:id', 
    authMiddleware,
    roleMiddleware('admin'),
    [
        param('id').isInt().withMessage('Report ID must be a valid integer')
    ],
    reportController.getReportbyId
);

router.put('/review/:id', 
    authMiddleware,
    roleMiddleware('admin'),
    [
        param('id').isInt().withMessage('Report ID must be a valid integer')
    ],
    reportController.ReviewReport
);

router.put('/ban/:id', 
    authMiddleware,
    roleMiddleware('admin'),
    [
        param('id').isInt().withMessage('User ID must be a valid integer')
    ],
    reportController.BanUser
);

router.put('/unban/:id', 
    authMiddleware,
    roleMiddleware('admin'),
    [
        param('id').isInt().withMessage('User ID must be a valid integer')
    ],
    reportController.UnbanUser
);

module.exports = router;

