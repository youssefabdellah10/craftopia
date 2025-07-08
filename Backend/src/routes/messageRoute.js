const router = require('express').Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/upload');
const { body, param } = require('express-validator');

router.post('/send/:responseId',
    authMiddleware,
    roleMiddleware(['customer', 'artist']),
    upload.fields([
        { name: 'attachment', maxCount: 1 }
    ]),
    [
        param('responseId').isInt().withMessage('Response ID must be an integer'),
        body('messageContent').notEmpty().trim().withMessage('Message content is required'),
        body('attachment').optional().isString().withMessage('Attachment must be a string')
    ],
    messageController.sendMessage
);


router.get('/unread',
    authMiddleware,
    roleMiddleware(['customer', 'artist']),
    messageController.getUnreadMessages
);

router.get('/conversation/:responseId',
    authMiddleware,
    roleMiddleware(['customer', 'artist']),
    [
        param('responseId').isInt().withMessage('Response ID must be an integer')
    ],
    messageController.getMessagesByRespondId
);

router.patch('/read/:messageId',
    authMiddleware,
    roleMiddleware(['customer', 'artist']),
    [
        param('messageId').isInt().withMessage('Message ID must be an integer')
    ],
    messageController.markMessageAsRead
);


module.exports = router;
