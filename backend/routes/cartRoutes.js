const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const { getCart, addToCart, updateCartItem, removeFromCart, applyCoupon, clearCart, mergeCart } = require('../controllers/cartController');

const router = express.Router();

router.get('/', optionalAuth, getCart);
router.post('/add', optionalAuth, addToCart);
router.put('/update', optionalAuth, updateCartItem);
router.delete('/remove/:productId', optionalAuth, removeFromCart);
router.post('/coupon', optionalAuth, applyCoupon);
router.delete('/clear', optionalAuth, clearCart);
router.post('/merge', protect, mergeCart);

module.exports = router;
