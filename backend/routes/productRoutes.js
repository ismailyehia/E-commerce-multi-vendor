const express = require('express');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { uploadProductImages } = require('../middleware/upload');
const {
    getProducts, getProduct, getProductById, createProduct, updateProduct,
    deleteProduct, getFeaturedProducts, autocomplete, getRecommendations,
    getMyProducts, getNewArrivals, getBestSellers
} = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/autocomplete', autocomplete);
router.get('/seller/me', protect, authorize('salesman', 'admin'), getMyProducts);
router.get('/id/:id', getProductById);
router.get('/:slug', optionalAuth, getProduct);
router.get('/:id/recommendations', getRecommendations);
router.post('/', protect, authorize('admin', 'salesman'), uploadProductImages, createProduct);
router.put('/:id', protect, authorize('admin', 'salesman'), uploadProductImages, updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
