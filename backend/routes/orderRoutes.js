const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
    createOrder, getMyOrders, getOrderById, getAllOrders,
    updateOrderStatus, assignDelivery, cancelOrder, getSalesmanOrders
} = require('../controllers/orderController');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/salesman', protect, authorize('salesman'), getSalesmanOrders);
router.get('/', protect, authorize('admin'), getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, authorize('admin', 'salesman'), updateOrderStatus);
router.put('/:id/assign-delivery', protect, authorize('admin'), assignDelivery);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
