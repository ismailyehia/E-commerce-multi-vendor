const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { uploadDeliveryProof } = require('../middleware/upload');
const {
    getAssignedDeliveries, getDeliveryById, acceptDelivery,
    updateDeliveryStatus, updateLocation, getDriverLocation,
    uploadProof, getAllDeliveries, getAvailableDeliveries,
    claimDelivery
} = require('../controllers/deliveryController');

const router = express.Router();

router.get('/assigned', protect, authorize('deliveryman'), getAssignedDeliveries);
router.get('/available', protect, authorize('deliveryman'), getAvailableDeliveries);
router.get('/all', protect, authorize('admin'), getAllDeliveries);
router.get('/track/:orderId', protect, getDriverLocation);
router.get('/:id', protect, getDeliveryById);
router.put('/:id/accept', protect, authorize('deliveryman'), acceptDelivery);
router.put('/:id/status', protect, authorize('deliveryman', 'admin'), updateDeliveryStatus);
router.put('/:id/location', protect, authorize('deliveryman'), updateLocation);
router.post('/claim/:orderId', protect, authorize('deliveryman'), claimDelivery);
router.post('/:id/proof', protect, authorize('deliveryman'), uploadDeliveryProof, uploadProof);

module.exports = router;
