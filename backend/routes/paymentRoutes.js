const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createStripeIntent, stripeWebhook, createPayPalOrder, capturePayPal, processRefund, getPaymentByOrder } = require('../controllers/paymentController');

const router = express.Router();

router.post('/stripe/create-intent', protect, createStripeIntent);
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
router.post('/paypal/create', protect, createPayPalOrder);
router.post('/paypal/capture', protect, capturePayPal);
router.post('/refund', protect, authorize('admin'), processRefund);
router.get('/order/:orderId', protect, getPaymentByOrder);

module.exports = router;
