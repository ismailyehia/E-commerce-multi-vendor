const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { uploadReviewImages } = require('../middleware/upload');
const { getProductReviews, createReview, voteReview, deleteReview, moderateReview, getAllReviews } = require('../controllers/reviewController');

const router = express.Router();

router.get('/product/:productId', getProductReviews);
router.get('/admin', protect, authorize('admin'), getAllReviews);
router.post('/', protect, uploadReviewImages, createReview);
router.post('/:id/vote', protect, voteReview);
router.put('/:id/moderate', protect, authorize('admin'), moderateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
