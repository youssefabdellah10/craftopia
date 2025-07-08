const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const customerController = require('../controllers/customerController');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { body, param } = require('express-validator');

router.get('/getprofile', authMiddleware, customerController.getProfile);

router.post('/createprofile', 
    authMiddleware,
    roleMiddleware('customer'),
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
        body('address').optional().isString().withMessage('Address must be a string'),
        body('profilePicture').optional().isURL().withMessage('Profile picture must be a valid URL')
    ],
    customerController.updateProfile
);

router.post('/follow/:artistId', 
    authMiddleware,
    roleMiddleware('customer'),
    param('artistId').isInt().withMessage('Artist ID must be an integer'),
    customerController.followArtist
);

router.delete('/unfollow/:artistId', 
    authMiddleware,
    roleMiddleware('customer'),
    param('artistId').isInt().withMessage('Artist ID must be an integer'),
    customerController.unfollowArtist
);

router.get('/followed-artists', 
    authMiddleware,
    roleMiddleware('customer'),
    customerController.getFollowing
);

router.get('/search',
    customerController.searchArtistsAndProducts
);
router.get('/all-customers', 
    authMiddleware, 
    roleMiddleware('admin'), 
    customerController.getAllCustomers
);


module.exports = router;