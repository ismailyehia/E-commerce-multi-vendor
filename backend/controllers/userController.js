const { prisma } = require('../config/db');

const getUsers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let whereClause = {};
        if (req.query.role) whereClause.role = req.query.role;
        if (req.query.search) {
            whereClause.OR = [
                { name: { contains: req.query.search } },
                { email: { contains: req.query.search } }
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true, name: true, email: true, role: true, avatar: true, phone: true, isActive: true, createdAt: true
                }
            }),
            prisma.user.count({ where: whereClause })
        ]);

        res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, name: true, email: true, role: true, avatar: true, phone: true, isActive: true, createdAt: true, address: true
            }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ message: 'Email already in use' });

        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, role, phone, updatedAt: new Date() }
        });
        if (user) delete user.password;

        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, email, role, phone, isActive } = req.body;
        let updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (phone) updateData.phone = phone;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, phone: true, isActive: true }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        res.json({ message: 'User deactivated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const toggleWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        console.log(`[Wishlist] Toggling for User: ${userId}, Product: ${productId}`);

        // 1. Verify product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true }
        });

        if (!product) {
            console.error(`[Wishlist] Product not found: ${productId}`);
            return res.status(404).json({ message: 'Product not found' });
        }

        // 2. Check if already in wishlist using findFirst + some
        const isAlreadyWishlisted = await prisma.user.findFirst({
            where: {
                id: userId,
                wishlist: { some: { id: productId } }
            }
        });

        // 3. Perform update
        const operation = isAlreadyWishlisted ? 'disconnect' : 'connect';
        console.log(`[Wishlist] Action: ${operation} product ${productId} for user ${userId}`);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                wishlist: {
                    [operation]: { id: productId }
                }
            },
            include: {
                wishlist: {
                    select: {
                        id: true, name: true, slug: true, price: true,
                        images: true, thumbnail: true, avgRating: true, numReviews: true,
                        totalStock: true, comparePrice: true
                    }
                }
            }
        });

        const formattedWishlist = updatedUser.wishlist.map(product => {
            if (typeof product.images === 'string') {
                try { product.images = JSON.parse(product.images); } catch (e) { product.images = []; }
            }
            return product;
        });

        res.json(formattedWishlist);
    } catch (error) {
        console.error(`[Wishlist] Error in toggleWishlist: ${error.message}`);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getWishlist = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                wishlist: {
                    select: { id: true, name: true, slug: true, price: true, comparePrice: true, images: true, thumbnail: true, avgRating: true, numReviews: true, totalStock: true }
                }
            }
        });

        const wishlist = (user?.wishlist || []).map(product => {
            if (typeof product.images === 'string') {
                try { product.images = JSON.parse(product.images); } catch (e) { product.images = []; }
            }
            return product;
        });

        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getRecentlyViewed = async (req, res) => {
    try {
        const views = await prisma.recentlyviewed.findMany({
            where: { userId: req.user.id },
            include: {
                product: { select: { id: true, name: true, slug: true, price: true, images: true, thumbnail: true, avgRating: true } }
            },
            orderBy: { viewedAt: 'desc' },
            take: 12
        });

        const formattedViews = views.map(view => {
            if (view.product && typeof view.product.images === 'string') {
                try { view.product.images = JSON.parse(view.product.images); } catch (e) { view.product.images = []; }
            }
            return view;
        });

        res.json(formattedViews);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getDeliverymen = async (req, res) => {
    try {
        const deliverymen = await prisma.user.findMany({
            where: { role: 'deliveryman', isActive: true },
            select: { id: true, name: true, email: true, phone: true, avatar: true }
        });
        res.json(deliverymen);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, toggleWishlist, getWishlist, getRecentlyViewed, getDeliverymen };
