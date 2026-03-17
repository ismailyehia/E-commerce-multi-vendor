const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { uploadAdMedia } = require('../middleware/upload');
const { getAds, clickAd, getAllAds, createAd, updateAd, deleteAd, getAdAnalytics } = require('../controllers/adController');

const router = express.Router();

router.get('/', getAds);
router.post('/:id/click', clickAd);
router.get('/admin', protect, authorize('admin'), getAllAds);
router.post('/', protect, authorize('admin'), uploadAdMedia, createAd);
router.put('/:id', protect, authorize('admin'), uploadAdMedia, updateAd);
router.delete('/:id', protect, authorize('admin'), deleteAd);
router.get('/:id/analytics', protect, authorize('admin'), getAdAnalytics);

module.exports = router;
