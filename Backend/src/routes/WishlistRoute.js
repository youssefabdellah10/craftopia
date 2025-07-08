const router = require('express').Router();
const wishlistController = require('../controllers/wishlistcontroller');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { param } = require('express-validator');

router.post('/add/:productId',
    authMiddleware,
    roleMiddleware('customer'),
    param('productId').isInt().withMessage('Product ID must be an integer'),
    wishlistController.addtoWishlist
);
router.get('/mywishlist',
    authMiddleware,
    roleMiddleware('customer'),
    wishlistController.getWishlist
);
router.delete('/remove/:productId',
    authMiddleware,
    roleMiddleware('customer'),
    wishlistController.removeFromWishlist
);

module.exports = router;
