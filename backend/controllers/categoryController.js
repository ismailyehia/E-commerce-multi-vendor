const { prisma } = require('../config/db');

// @desc    Get all categories
// @route   GET /api/categories
const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { parentId: null, isActive: true },
            include: {
                subcategories: {
                    where: { isActive: true },
                    select: { id: true, name: true, slug: true, image: true, icon: true }
                }
            },
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
            ]
        });

        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all categories (flat, for admin)
// @route   GET /api/categories/all
const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                parent: {
                    select: { name: true }
                }
            },
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
            ]
        });

        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get category by slug
// @route   GET /api/categories/:slug
const getCategory = async (req, res) => {
    try {
        const category = await prisma.category.findUnique({
            where: { slug: req.params.slug },
            include: {
                subcategories: {
                    where: { isActive: true }
                }
            }
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create category
// @route   POST /api/categories
const createCategory = async (req, res) => {
    try {
        const categoryData = { ...req.body };

        if (req.file) {
            categoryData.image = req.file.path;
        }

        // Parse sortOrder if present
        if (categoryData.sortOrder) {
            categoryData.sortOrder = parseInt(categoryData.sortOrder, 10);
        }

        const category = await prisma.category.create({
            data: { ...categoryData, updatedAt: new Date() }
        });

        res.status(201).json(category);
    } catch (error) {
        // Prisma unique constraint violation code is P2002
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
const updateCategory = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (req.file) {
            updateData.image = req.file.path;
        }

        // Parse sortOrder if present
        if (updateData.sortOrder) {
            updateData.sortOrder = parseInt(updateData.sortOrder, 10);
        }

        // Handle isActive boolean parsing if necessary
        if (updateData.isActive !== undefined && typeof updateData.isActive === 'string') {
            updateData.isActive = updateData.isActive === 'true';
        }

        const category = await prisma.category.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(category);
    } catch (error) {
        if (error.code === 'P2025') { // Record to update not found
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
    try {
        // Find category to verify it exists
        const category = await prisma.category.findUnique({
            where: { id: req.params.id }
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Soft delete the category
        await prisma.category.update({
            where: { id: category.id },
            data: { isActive: false }
        });

        // Soft delete its subcategories
        await prisma.category.updateMany({
            where: { parentId: category.id },
            data: { isActive: false }
        });

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getCategories,
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
};
