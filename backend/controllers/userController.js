const { prisma } = require('../config/db');
const { formatUser } = require('./authController');

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

        console.log(`[Wishlist] START Toggling for User: ${userId}, Product: ${productId}`);

        // 1. Verify product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true }
        });

        if (!product) {
            console.error(`[Wishlist] Product not found: ${productId}`);
            return res.status(404).json({ message: 'Product not found' });
        }

        // 2. Check if already in wishlist
        const existingItem = await prisma.wishlistitem.findUnique({
            where: {
                userId_productId: { userId, productId }
            }
        });

        // 3. Perform update
        if (existingItem) {
            console.log(`[Wishlist] Action: removing product ${productId} for user ${userId}`);
            await prisma.wishlistitem.delete({
                where: { id: existingItem.id }
            });
            console.log(`[Wishlist] Action: SUCCESS removing product ${productId}`);
        } else {
            console.log(`[Wishlist] Action: adding product ${productId} for user ${userId}`);
            await prisma.wishlistitem.create({
                data: { userId, productId }
            });
            console.log(`[Wishlist] Action: SUCCESS adding product ${productId}`);
        }

        console.log(`[Wishlist] Fetching updated user for wishlist sync...`);
        // 4. Return the full user (same as getMe)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                address: true,
                wishlist: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!user) {
            console.error(`[Wishlist] User not found after update: ${userId}`);
            return res.status(404).json({ message: 'User not found' });
        }

        const formattedUser = formatUser(user);
        console.log(`[Wishlist] SUCCESS: Returning formatted user`);
        res.json(formattedUser);
    } catch (error) {
        console.error(`[Wishlist ERROR] toggleWishlist:`, error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getWishlist = async (req, res) => {
    try {
        console.log(`[Wishlist] Fetching wishlist for User: ${req.user.id}`);
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                wishlist: {
                    include: {
                        product: true
                    }
                }
            }
        });

        const wishlist = (user?.wishlist || [])
            .filter(item => item.product)
            .map(item => {
                const prod = { ...item.product };
                if (typeof prod.images === 'string') {
                    try { prod.images = JSON.parse(prod.images); } catch (e) { prod.images = []; }
                }
                return prod;
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
                product: true
            },
            orderBy: { viewedAt: 'desc' },
            take: 12
        });

        const formattedViews = views.map(view => {
            const product = view.product ? { ...view.product } : null;
            if (product && typeof product.images === 'string') {
                try { product.images = JSON.parse(product.images); } catch (e) { product.images = []; }
            }
            return { ...view, product };
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
