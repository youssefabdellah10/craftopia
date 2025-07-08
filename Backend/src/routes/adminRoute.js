const router = require('express').Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { body } = require('express-validator');

router.get('/profile', 
    authMiddleware, 
    roleMiddleware('admin'), 
    adminController.getProfile
);

router.post('/profile/update', 
    authMiddleware, 
    roleMiddleware('admin'),
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('username').notEmpty().withMessage('Username is required'),
        body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('Please provide a valid phone number')
    ],
    adminController.updateProfile
);

router.get('/dashboard', 
    authMiddleware, 
    roleMiddleware('admin'), 
    adminController.getDashboardStats
);

router.delete('/artists/:artistId',
    authMiddleware,
    roleMiddleware('admin'),
    adminController.removeArtist
);

router.post('/add-admin',
    authMiddleware,
    roleMiddleware('admin'),
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('username').notEmpty().withMessage('Username is required'),
        body('email').isEmail().withMessage('Please provide a valid email address'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('Please provide a valid phone number')
    ],
    adminController.addAdmin
);

module.exports = router;