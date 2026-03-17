const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { uploadCategoryImage } = require('../middleware/upload');
const { getCategories, getAllCategories, getCategory, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');

const router = express.Router();

router.get('/', getCategories);
router.get('/all', protect, authorize('admin', 'salesman'), getAllCategories);
router.get('/:slug', getCategory);
router.post('/', protect, authorize('admin'), uploadCategoryImage, createCategory);
router.put('/:id', protect, authorize('admin'), uploadCategoryImage, updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;
