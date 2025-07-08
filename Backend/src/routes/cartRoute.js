const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['customer']));

router.post(
  '/add/:productId',
  [
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  ],
  cartController.addToCart
);

router.post('/increment/:productId', cartController.incrementCartItem);  
router.post('/decrement/:productId', cartController.decrementCartItem);  

router.get('/', cartController.getCart);

router.delete('/remove/:productId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);

module.exports = router;
