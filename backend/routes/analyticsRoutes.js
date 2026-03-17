const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getDashboardStats, getSalesChart, getTopProducts, getOrderStatusDistribution, getRevenueByCategory } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/dashboard', protect, authorize('admin'), getDashboardStats);
router.get('/sales-chart', protect, authorize('admin'), getSalesChart);
router.get('/top-products', protect, authorize('admin'), getTopProducts);
router.get('/order-status', protect, authorize('admin'), getOrderStatusDistribution);
router.get('/revenue-by-category', protect, authorize('admin'), getRevenueByCategory);

module.exports = router;
