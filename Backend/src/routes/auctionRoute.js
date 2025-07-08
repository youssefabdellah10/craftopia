const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const auctionController = require('../controllers/auctionController');
const { param, query } = require('express-validator');

router.get('/', 
    [
        query('status').optional().isIn(['active', 'ended', 'scheduled']).withMessage('Status must be active, ended, or scheduled'),
        query('category').optional().isInt().withMessage('Category ID must be an integer'),
        query('artist').optional().isInt().withMessage('Artist ID must be an integer')
    ],
    auctionController.getAuctions
);

router.get('/:auctionId',
    param('auctionId').notEmpty().withMessage('Auction ID is required'),
    auctionController.getAuctionDetails
);

router.get('/product/:auctionId', 
    param('auctionId').notEmpty().withMessage('Auction ID is required'),
    auctionController.getAuctionProduct
);
router.get('/artist-product/:artistId',
    param('artistId').notEmpty().withMessage('Artist ID is required'),
    auctionController.getAuctionProductsByArtist
);
module.exports = router;
