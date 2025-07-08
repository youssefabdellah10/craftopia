const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { body, param } = require('express-validator');

router.use(authMiddleware);
router.use(roleMiddleware(['customer']));

router.post('/add', [
    body('artistId').isInt().withMessage('Artist ID must be an integer'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ max: 500 }).withMessage('Comment must not exceed 500 characters')
], ratingController.addRating);

router.get('/artist/:artistId', [
    param('artistId').isInt().withMessage('Artist ID must be an integer')
], ratingController.getArtistRatings);

router.get('/my-rating/:artistId', [
    param('artistId').isInt().withMessage('Artist ID must be an integer')
], ratingController.getCustomerRating);

module.exports = router;
