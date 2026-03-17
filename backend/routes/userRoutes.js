const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getUsers, getUserById, createUser, updateUser, deleteUser, toggleWishlist, getWishlist, getRecentlyViewed, getDeliverymen } = require('../controllers/userController');

const router = express.Router();

router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:productId', protect, toggleWishlist);
router.get('/recently-viewed', protect, getRecentlyViewed);
router.get('/deliverymen', protect, authorize('admin'), getDeliverymen);
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.post('/', protect, authorize('admin'), createUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
