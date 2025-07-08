const router = require('express').Router();
const bidController = require('../controllers/bidController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { body, param } = require('express-validator');

router.post('/place', 
    authMiddleware,
    roleMiddleware('customer'),
    [
        body('auctionId').isString().withMessage('Auction ID must be a string'),
        body('bidAmount').isFloat({ min: 0 }).withMessage('Bid amount must be a positive number')
    ],
    bidController.placeBid
);

router.get('/auction/:auctionId',
    authMiddleware,
    param('auctionId').isInt().withMessage('Auction ID must be an integer'),
    bidController.getBidsByAuction
);

router.get('/my-bids',
    authMiddleware,
    roleMiddleware('customer'),
    bidController.getMyBids
);

router.get('/today-bids',
    bidController.getTodayBids
);

router.put('/update',
    authMiddleware,
    roleMiddleware('customer'),
    [
        body('auctionId').isString().withMessage('Auction ID must be a string'),
        body('newBidAmount').isFloat({ min: 0 }).withMessage('New bid amount must be a positive number')
    ],
    bidController.updateBid
);

module.exports = router;