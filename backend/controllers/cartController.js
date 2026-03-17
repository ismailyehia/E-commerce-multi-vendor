const { prisma } = require('../config/db');

const formatCart = (cart) => {
    if (!cart) return cart;
    const formatted = { ...cart };
    if (cart.items) {
        formatted.items = cart.items.map(item => {
            const newItem = { ...item };
            if (item.variant && typeof item.variant === 'string') {
                try { newItem.variant = JSON.parse(item.variant); } catch (e) { }
            }
            if (item.product) {
                const newProduct = { ...item.product };
                if (newProduct.images && typeof newProduct.images === 'string') {
                    try { newProduct.images = JSON.parse(newProduct.images); } catch (e) { }
                }
                if (newProduct.variants && typeof newProduct.variants === 'string') {
                    try { newProduct.variants = JSON.parse(newProduct.variants); } catch (e) { }
                }
                if (newProduct.tags && typeof newProduct.tags === 'string') {
                    try { newProduct.tags = JSON.parse(newProduct.tags); } catch (e) { }
                }
                newItem.product = newProduct;
            }
            return newItem;
        });
    }
    return formatted;
};

// @desc    Get cart
// @route   GET /api/cart
const getCart = async (req, res) => {
    try {
        const query = req.user ? { userId: req.user.id } : { sessionId: req.query.sessionId };

        if (!query.userId && !query.sessionId) {
            return res.json({ items: [], couponCode: null, couponDiscount: 0 });
        }

        let cart = await prisma.cart.findFirst({
            where: query,
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, slug: true, price: true, comparePrice: true, images: true, thumbnail: true, totalStock: true, variants: true, isActive: true }
                        }
                    }
                }
            }
        });

        if (!cart) {
            return res.json({ items: [], couponCode: null, couponDiscount: 0 });
        }

        // Filter out inactive products
        cart.items = cart.items.filter(item => item.product && item.product.isActive);

        res.json(formatCart(cart));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
const addToCart = async (req, res) => {
    try {
        const { productId, variant, quantity = 1, sessionId } = req.body;

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { variants: true }
        });

        if (!product || !product.isActive) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check stock
        let parsedVariant = typeof variant === 'string' ? JSON.parse(variant) : variant;
        if (parsedVariant && parsedVariant.sku) {
            const productVariant = product.variants.find(v => v.sku === parsedVariant.sku);
            if (!productVariant || productVariant.stock < quantity) {
                return res.status(400).json({ message: 'Insufficient stock for this variant' });
            }
        } else if (product.totalStock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        const query = req.user ? { userId: req.user.id } : { sessionId };

        if (!query.userId && !query.sessionId) {
            return res.status(400).json({ message: 'User or Session ID required' });
        }

        let cart = await prisma.cart.findFirst({
            where: query,
            include: { items: true }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    userId: req.user ? req.user.id : null,
                    sessionId: req.user ? null : sessionId,
                    updatedAt: new Date()
                },
                include: { items: true }
            });
        }

        // Check if item already in cart
        const existingItem = cart.items.find(item => {
            if (item.productId !== productId) return false;
            let itemVariant = typeof item.variant === 'string' ? JSON.parse(item.variant) : item.variant;
            if (parsedVariant && parsedVariant.sku) {
                return itemVariant && itemVariant.sku === parsedVariant.sku;
            }
            return true;
        });

        if (existingItem) {
            await prisma.cartitem.update({
                where: { id: existingItem.id },
                data: { quantity: { increment: quantity } }
            });
        } else {
            await prisma.cartitem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    variant: parsedVariant ? JSON.stringify(parsedVariant) : null,
                    quantity
                }
            });
        }

        cart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, slug: true, price: true, comparePrice: true, images: true, thumbnail: true, totalStock: true, variants: true, isActive: true }
                        }
                    }
                }
            }
        });

        res.json(formatCart(cart));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
const updateCartItem = async (req, res) => {
    try {
        const { productId, sku, quantity } = req.body;

        const query = req.user ? { userId: req.user.id } : { sessionId: req.body.sessionId };
        const cart = await prisma.cart.findFirst({
            where: query,
            include: { items: true }
        });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.items.find(item => {
            if (item.productId !== productId) return false;
            let itemVariant = typeof item.variant === 'string' ? JSON.parse(item.variant) : item.variant;
            if (sku) return itemVariant && itemVariant.sku === sku;
            return true;
        });

        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        if (quantity <= 0) {
            await prisma.cartitem.delete({ where: { id: item.id } });
        } else {
            await prisma.cartitem.update({
                where: { id: item.id },
                data: { quantity }
            });
        }

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, slug: true, price: true, comparePrice: true, images: true, thumbnail: true, totalStock: true, variants: true, isActive: true }
                        }
                    }
                }
            }
        });

        res.json(formatCart(updatedCart));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const sku = req.query.sku;

        const query = req.user ? { userId: req.user.id } : { sessionId: req.query.sessionId };
        const cart = await prisma.cart.findFirst({
            where: query,
            include: { items: true }
        });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the specific item to remove
        const itemsToRemove = cart.items.filter(item => {
            if (item.productId !== productId) return false;
            let itemVariant = typeof item.variant === 'string' ? JSON.parse(item.variant) : item.variant;
            if (sku) return itemVariant && itemVariant.sku === sku;
            return true;
        });

        if (itemsToRemove.length > 0) {
            await prisma.cartitem.deleteMany({
                where: { id: { in: itemsToRemove.map(i => i.id) } }
            });
        }

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, slug: true, price: true, comparePrice: true, images: true, thumbnail: true, totalStock: true, variants: true, isActive: true }
                        }
                    }
                }
            }
        });

        res.json(updatedCart ? formatCart(updatedCart) : { items: [] });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Apply coupon
// @route   POST /api/cart/coupon
const applyCoupon = async (req, res) => {
    try {
        const { code, sessionId } = req.body;

        const coupon = await prisma.coupon.findFirst({
            where: {
                code: code.toUpperCase(),
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() }
            }
        });

        if (!coupon) {
            return res.status(400).json({ message: 'Invalid or expired coupon' });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        const query = req.user ? { userId: req.user.id } : { sessionId };
        let cart = await prisma.cart.findFirst({
            where: query,
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Calculate cart total
        const cartTotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
            return res.status(400).json({
                message: `Minimum order amount is $${coupon.minOrderAmount}`
            });
        }

        let discount = 0;
        if (coupon.type === 'percentage') {
            discount = (cartTotal * coupon.value) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        } else {
            discount = coupon.value;
        }

        cart = await prisma.cart.update({
            where: { id: cart.id },
            data: {
                couponCode: coupon.code,
                couponDiscount: discount
            }
        });

        res.json({ message: 'Coupon applied', discount, couponCode: coupon.code });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
const clearCart = async (req, res) => {
    try {
        const query = req.user ? { userId: req.user.id } : { sessionId: req.query.sessionId };
        const cart = await prisma.cart.findFirst({ where: query });

        if (cart) {
            await prisma.cart.delete({ where: { id: cart.id } });
        }
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Merge guest cart to user cart on login
// @route   POST /api/cart/merge
const mergeCart = async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId || !req.user) {
            return res.json({ message: 'No merge needed' });
        }

        const guestCart = await prisma.cart.findFirst({
            where: { sessionId },
            include: { items: true }
        });

        if (!guestCart || guestCart.items.length === 0) {
            if (guestCart) await prisma.cart.delete({ where: { id: guestCart.id } }); // Cleanup empty cart
            return res.json({ message: 'No guest cart to merge' });
        }

        let userCart = await prisma.cart.findFirst({
            where: { userId: req.user.id },
            include: { items: true }
        });

        if (!userCart) {
            // Convert guest cart to user cart
            await prisma.cart.update({
                where: { id: guestCart.id },
                data: {
                    userId: req.user.id,
                    sessionId: null
                }
            });
        } else {
            // Merge items
            for (const guestItem of guestCart.items) {
                let guestVariant = typeof guestItem.variant === 'string' ? JSON.parse(guestItem.variant) : guestItem.variant;

                const existingItem = userCart.items.find(item => {
                    if (item.productId !== guestItem.productId) return false;
                    let itemVariant = typeof item.variant === 'string' ? JSON.parse(item.variant) : item.variant;
                    if (guestVariant && guestVariant.sku) {
                        return itemVariant && itemVariant.sku === guestVariant.sku;
                    }
                    return true;
                });

                if (existingItem) {
                    await prisma.cartitem.update({
                        where: { id: existingItem.id },
                        data: { quantity: { increment: guestItem.quantity } }
                    });
                } else {
                    await prisma.cartitem.create({
                        data: {
                            cartId: userCart.id,
                            productId: guestItem.productId,
                            variant: guestItem.variant ? (typeof guestItem.variant === 'object' ? JSON.stringify(guestItem.variant) : guestItem.variant) : null,
                            quantity: guestItem.quantity
                        }
                    });
                }
            }

            // Delete guest cart
            await prisma.cart.delete({ where: { id: guestCart.id } });
        }

        const updatedCart = await prisma.cart.findFirst({
            where: { userId: req.user.id },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, slug: true, price: true, comparePrice: true, images: true, thumbnail: true, totalStock: true, variants: true, isActive: true }
                        }
                    }
                }
            }
        });

        res.json(formatCart(updatedCart));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    applyCoupon,
    clearCart,
    mergeCart
};
