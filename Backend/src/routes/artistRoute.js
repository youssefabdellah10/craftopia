const router = require('express').Router();
const artistController = require('../controllers/artistController');
const upload = require('../middlewares/upload');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { body, param } = require('express-validator');

// Optional auth middleware - doesn't require authentication but populates user if present
const optionalAuth = (req, res, next) => {
    // If no authorization header, continue without user
    if (!req.headers.authorization) {
        return next();
    }

    // If authorization header exists, try to authenticate
    authMiddleware(req, res, (err) => {
        // If auth fails, continue without user (don't block the request)
        if (err) {
            req.user = null;
        }
        next();
    });
};

router.get('/getprofile/:artistId',
    param('artistId').isInt().withMessage('Artist ID must be an integer'),
    optionalAuth,
    artistController.getArtist
);
router.get('/all', artistController.getAllArtists);
router.get('/:artistId/followers',
    param('artistId').isInt().withMessage('Artist ID must be an integer'),
    artistController.getArtistFollowers
);

router.post('/update',
    authMiddleware,
    roleMiddleware('artist'),
    upload.fields([
        { name: 'profilePicture', maxCount: 1 },
        { name: 'profileVideo', maxCount: 1 }
    ]),
    [
        body('name').optional().isString().trim().isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters'),
        body('bio').optional().isString().trim()
            .withMessage('Bio must be a string'),
        body('phone').optional().matches(/^\+?[0-9]{10,15}$/)
            .withMessage('Please provide a valid phone number')
    ],
    artistController.updateArtist
);

router.get('/myprofile',
    authMiddleware,
    roleMiddleware('artist'),
    artistController.getProfile
);
router.get('/getbyname/:name',
    optionalAuth,
    artistController.getArtistByName
);


module.exports = router;