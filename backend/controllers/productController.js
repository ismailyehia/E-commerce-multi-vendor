const { prisma } = require('../config/db');
const SearchService = require('../services/searchService');

const formatProduct = (product) => {
    if (!product) return product;
    let formatted = { ...product };
    try { if (typeof formatted.images === 'string') formatted.images = JSON.parse(formatted.images); } catch (e) { }
    try { if (typeof formatted.tags === 'string') formatted.tags = JSON.parse(formatted.tags); } catch (e) { }
    if (product.variants !== undefined) {
        formatted.variants = product.variants;
    }
    return formatted;
};

// @desc    Get all products (with filters)
// @route   GET /api/products
const getProducts = async (req, res) => {
    try {
        const result = await SearchService.searchProducts(req.query);
        if (result.products) {
            result.products = result.products.map(formatProduct);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:slug
const getProduct = async (req, res) => {
    try {
        const product = await prisma.product.findFirst({
            where: { slug: req.params.slug, isActive: true },
            include: {
                category: { select: { name: true, slug: true, id: true } },
                subcategory: { select: { name: true, slug: true, id: true } },
                seller: { select: { name: true, avatar: true } },
                variants: true
            }
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Track view if user is authenticated
        if (req.user) {
            // Create a recently viewed instead of pushing
            await prisma.recentlyviewed.create({
                data: {
                    userId: req.user.id,
                    productId: product.id
                }
            });

            // Keep only latest 20
            const views = await prisma.recentlyviewed.findMany({
                where: { userId: req.user.id },
                orderBy: { viewedAt: 'desc' },
                skip: 20
            });

            if (views.length > 0) {
                await prisma.recentlyviewed.deleteMany({
                    where: { id: { in: views.map(v => v.id) } }
                });
            }
        }

        res.json(formatProduct(product));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get product by ID
// @route   GET /api/products/id/:id
const getProductById = async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                category: { select: { name: true, slug: true } },
                seller: { select: { name: true, avatar: true } }
            }
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(formatProduct(product));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create product
// @route   POST /api/products
const createProduct = async (req, res) => {
    try {
        const { category, subcategory, variants, tags, isFeatured, ...restBody } = req.body;

        let images = [];
        let thumbnail = null;

        if (req.files && req.files.length > 0) {
            images = req.files.map(f => f.path);
            thumbnail = images[0];
        }

        let parsedVariants = variants;
        if (variants && typeof variants === 'string') {
            parsedVariants = JSON.parse(variants);
        }

        let parsedTags = tags;
        if (tags && typeof tags === 'string') {
            parsedTags = JSON.parse(tags);
        }

        const isFeaturedBool = typeof isFeatured === 'string' ? isFeatured === 'true' : isFeatured;

        const totalStock = parsedVariants ? parsedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) : 0;

        const product = await prisma.product.create({
            data: {
                ...restBody,
                price: parseFloat(restBody.price),
                comparePrice: restBody.comparePrice ? parseFloat(restBody.comparePrice) : null,
                sellerId: req.user.id,
                categoryId: category,
                subcategoryId: subcategory || null,
                images: JSON.stringify(images),
                thumbnail,
                tags: JSON.stringify(parsedTags),
                isFeatured: isFeaturedBool,
                totalStock,
                slug: restBody.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
                updatedAt: new Date(),
                variants: parsedVariants ? { create: parsedVariants } : undefined
            }
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        let product = await prisma.product.findUnique({ where: { id: req.params.id } });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check ownership (admin can update any, salesman only their own)
        if (req.user.role === 'salesman' && product.sellerId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this product' });
        }

        const { category, subcategory, variants, tags, isFeatured, ...restBody } = req.body;

        let updateData = { ...restBody };
        if (restBody.price) updateData.price = parseFloat(restBody.price);
        if (restBody.comparePrice) updateData.comparePrice = parseFloat(restBody.comparePrice);
        if (category) updateData.categoryId = category;
        if (subcategory) updateData.subcategoryId = subcategory;

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(f => f.path);
            const existingImages = product.images ? (Array.isArray(product.images) ? product.images : JSON.parse(product.images)) : [];
            updateData.images = [...existingImages, ...newImages];
            if (!product.thumbnail) updateData.thumbnail = newImages[0];
        }

        if (tags) {
            updateData.tags = typeof tags === 'string' ? tags : JSON.stringify(tags);
        }

        if (typeof isFeatured !== 'undefined') {
            updateData.isFeatured = typeof isFeatured === 'string' ? isFeatured === 'true' : isFeatured;
        }

        if (updateData.images) {
            updateData.images = JSON.stringify(updateData.images);
        }

        product = await prisma.product.update({
            where: { id: req.params.id },
            data: updateData
        });

        // Handle variants if provided
        if (variants) {
            let parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;

            // Delete old variants first
            await prisma.variant.deleteMany({ where: { productId: req.params.id } });

            if (parsedVariants && parsedVariants.length > 0) {
                // Calculate new total stock
                const totalStock = parsedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

                // Update product total stock
                await prisma.product.update({
                    where: { id: req.params.id },
                    data: { totalStock }
                });

                // Remove id from variants to allow creation of new ones with fresh UUIDs
                const variantsToCreate = parsedVariants.map(v => {
                    const { id, ...vRest } = v;
                    return { ...vRest, productId: req.params.id };
                });

                await prisma.variant.createMany({
                    data: variantsToCreate
                });
            } else {
                // If variants cleared, set totalStock to 0
                await prisma.product.update({
                    where: { id: req.params.id },
                    data: { totalStock: 0 }
                });
            }
        }

        res.json(product);
    } catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await prisma.product.findUnique({ where: { id: req.params.id } });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Soft delete
        await prisma.product.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get featured products
// @route   GET /api/products/featured
const getFeaturedProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true, isFeatured: true },
            include: {
                category: { select: { name: true, slug: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 12
        });

        res.json(products.map(formatProduct));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get autocomplete suggestions
// @route   GET /api/products/autocomplete
const autocomplete = async (req, res) => {
    try {
        const { q } = req.query;
        const suggestions = await SearchService.getAutocompleteSuggestions(q);
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get product recommendations
// @route   GET /api/products/:id/recommendations
const getRecommendations = async (req, res) => {
    try {
        const recommendations = await SearchService.getRecommendations(req.params.id);
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get seller's products
// @route   GET /api/products/seller/me
const getMyProducts = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let whereClause = { sellerId: req.user.id };
        if (req.query.search) {
            whereClause.name = { contains: req.query.search };
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: whereClause,
                include: { category: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.product.count({ where: whereClause })
        ]);

        res.json({
            products: products.map(formatProduct),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
const getNewArrivals = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: { category: { select: { name: true, slug: true } } },
            orderBy: { createdAt: 'desc' },
            take: 12
        });

        res.json(products.map(formatProduct));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get best sellers
// @route   GET /api/products/best-sellers
const getBestSellers = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: { category: { select: { name: true, slug: true } } },
            orderBy: { totalSold: 'desc' },
            take: 12
        });

        res.json(products.map(formatProduct));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getProducts,
    getProduct,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getFeaturedProducts,
    autocomplete,
    getRecommendations,
    getMyProducts,
    getNewArrivals,
    getBestSellers
};
