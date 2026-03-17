const { prisma } = require('../config/db');
const { generateInvoice } = require('../utils/invoiceGenerator');
const { sendOrderConfirmation, sendDeliveryUpdate } = require('../utils/emailService');

const formatOrder = (order) => {
    if (!order) return order;
    let formatted = { ...order };
    if (order.orderitem) {
        formatted.items = order.orderitem.map(item => {
            let newItem = { ...item };
            if (item.variant && typeof item.variant === 'string') {
                try { newItem.variant = JSON.parse(item.variant); } catch (e) { }
            }
            return newItem;
        });
        delete formatted.orderitem;
    }
    if (order.orderstatushistory) {
        formatted.statusHistory = order.orderstatushistory;
        delete formatted.orderstatushistory;
    }
    if (order.shippingAddress && typeof order.shippingAddress === 'string') {
        try { formatted.shippingAddress = JSON.parse(order.shippingAddress); } catch (e) { }
    }
    return formatted;
};

// @desc    Create order
// @route   POST /api/orders
const createOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod, couponCode } = req.body;

        const cart = await prisma.cart.findFirst({
            where: { userId: req.user.id },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Build order items & calculate prices
        let itemsPrice = 0;
        const orderItems = [];

        for (const item of cart.items) {
            if (!item.product || !item.product.isActive) continue;

            let price = item.product.price;
            let variantData = item.variant ? (typeof item.variant === 'string' ? JSON.parse(item.variant) : item.variant) : null;

            if (variantData && variantData.sku) {
                // Find variant in DB
                const variant = await prisma.variant.findUnique({
                    where: { sku: variantData.sku }
                });
                if (variant && variant.price) price = variant.price;
            }

            let thumbnail = item.product.thumbnail;
            if (!thumbnail && item.product.images) {
                const images = typeof item.product.images === 'string' ? JSON.parse(item.product.images) : item.product.images;
                if (images && images.length > 0) thumbnail = images[0];
            }

            orderItems.push({
                productId: item.product.id,
                name: item.product.name,
                image: thumbnail || '',
                variant: variantData ? JSON.stringify(variantData) : null,
                quantity: item.quantity,
                price
            });

            itemsPrice += price * item.quantity;
        }

        if (orderItems.length === 0) {
            return res.status(400).json({ message: 'No valid items in cart' });
        }

        const shippingPrice = itemsPrice > 100 ? 0 : 9.99;
        const taxPrice = Number((itemsPrice * 0.08).toFixed(2));
        const discountAmount = cart.couponDiscount || 0;
        const totalPrice = Number((itemsPrice + shippingPrice + taxPrice - discountAmount).toFixed(2));

        // Generate Order Number
        const count = await prisma.order.count();
        const orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(5, '0')}`;

        const initialStatus = paymentMethod === 'cod' ? 'processing' : 'pending';

        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: req.user.id,
                updatedAt: new Date(),
                shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
                paymentMethod,
                itemsPrice,
                shippingPrice,
                taxPrice,
                discountAmount,
                totalPrice,
                couponCode,
                status: initialStatus,
                orderitem: {
                    create: orderItems
                },
                orderstatushistory: {
                    create: [{
                        status: initialStatus,
                        note: 'Order created',
                    }]
                }
            },
            include: {
                orderitem: true,
                user: true
            }
        });

        // Update product stock
        for (const item of orderItems) {
            await prisma.product.update({
                where: { id: item.productId },
                data: { totalSold: { increment: item.quantity } }
            });

            if (item.variant) {
                const variantData = typeof item.variant === 'string' ? JSON.parse(item.variant) : item.variant;
                if (variantData.sku) {
                    await prisma.variant.updateMany({
                        where: { sku: variantData.sku },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
            }
        }

        // Clear cart
        await prisma.cart.delete({ where: { id: cart.id } });

        // Update coupon usage
        if (couponCode) {
            await prisma.coupon.update({
                where: { code: couponCode.toUpperCase() },
                data: { usedCount: { increment: 1 } }
            });
        }

        const formattedOrder = formatOrder(order);

        // Generate invoice
        try {
            const invoicePath = await generateInvoice(formattedOrder, req.user);
            await prisma.order.update({
                where: { id: order.id },
                data: { invoice: invoicePath }
            });
        } catch (err) {
            console.error('Invoice generation failed:', err);
        }

        // Send email notification
        sendOrderConfirmation(req.user, formattedOrder);

        // Create notification
        await prisma.notification.create({
            data: {
                userId: req.user.id,
                type: 'order',
                title: 'Order Placed',
                message: `Your order ${order.orderNumber} has been placed successfully!`,
                data: JSON.stringify({ orderId: order.id })
            }
        });

        res.status(201).json(formattedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get my orders
// @route   GET /api/orders/mine
const getMyOrders = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let whereClause = { userId: req.user.id };
        if (req.query.status) whereClause.status = req.query.status;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    deliveryman: { select: { name: true, phone: true } },
                    orderitem: true
                }
            }),
            prisma.order.count({ where: whereClause })
        ]);

        res.json({
            orders: orders.map(formatOrder),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                deliveryman: { select: { name: true, phone: true } },
                orderitem: {
                    include: { product: { select: { name: true, slug: true, images: true } } }
                },
                orderstatushistory: {
                    orderBy: { timestamp: 'asc' }
                },
                delivery: true
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Customers can only see their own orders
        if (req.user.role === 'customer' && order.user.id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(formatOrder(order));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
const getAllOrders = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let whereClause = {};
        if (req.query.status) whereClause.status = req.query.status;
        if (req.query.search) {
            whereClause.orderNumber = { contains: req.query.search };
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: whereClause,
                include: {
                    user: { select: { name: true, email: true } },
                    deliveryman: { select: { name: true } },
                    orderitem: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.order.count({ where: whereClause })
        ]);

        res.json({
            orders: orders.map(formatOrder),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;
        let order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { user: { select: { name: true, email: true } } }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        let updateData = { status };
        if (status === 'delivered') updateData.deliveredAt = new Date();
        if (status === 'paid') updateData.paidAt = new Date();
        if (status === 'cancelled') {
            updateData.cancelledAt = new Date();
            updateData.cancelReason = note;
        }

        order = await prisma.order.update({
            where: { id: order.id },
            data: {
                ...updateData,
                orderstatushistory: {
                    create: {
                        status,
                        note,
                        updatedById: req.user.id
                    }
                }
            },
            include: { user: true, orderitem: true, orderstatushistory: true }
        });

        // Send email update
        if (order.user && order.user.email) {
            sendDeliveryUpdate(order.user, order, status);
        }

        // Create notification
        await prisma.notification.create({
            data: {
                userId: order.userId,
                type: 'order',
                title: 'Order Updated',
                message: `Your order ${order.orderNumber} status: ${status.replace(/_/g, ' ')}`,
                data: JSON.stringify({ orderId: order.id })
            }
        });

        res.json(formatOrder(order));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Assign delivery
// @route   PUT /api/orders/:id/assign-delivery
const assignDelivery = async (req, res) => {
    try {
        const { deliverymanId } = req.body;

        let order = await prisma.order.findUnique({ where: { id: req.params.id } });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const deliveryman = await prisma.user.findUnique({ where: { id: deliverymanId } });
        if (!deliveryman || deliveryman.role !== 'deliveryman') {
            return res.status(400).json({ message: 'Invalid deliveryman' });
        }

        let updateData = { deliverymanId };

        let statusHistoryData = undefined;
        if (order.status === 'processing' || order.status === 'paid') {
            updateData.status = 'shipped';
            statusHistoryData = {
                create: {
                    status: 'shipped',
                    note: `Assigned to ${deliveryman.name}`,
                    updatedById: req.user.id
                }
            };
        }

        order = await prisma.order.update({
            where: { id: order.id },
            data: {
                ...updateData,
                ...(statusHistoryData && { orderstatushistory: statusHistoryData })
            }
        });

        // Create Delivery record

        let parsedAddress = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;

        await prisma.delivery.create({
            data: {
                orderId: order.id,
                deliverymanId,
                deliveryLocationAddress: `${parsedAddress.street}, ${parsedAddress.city}, ${parsedAddress.state}`
            }
        });

        // Notify deliveryman
        await prisma.notification.create({
            data: {
                userId: deliverymanId,
                type: 'delivery',
                title: 'New Delivery Assigned',
                message: `Order ${order.orderNumber} has been assigned to you`,
                data: JSON.stringify({ orderId: order.id })
            }
        });

        res.json(formatOrder(order));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
    try {
        let order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { orderitem: true }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (req.user.role === 'customer' && order.userId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const cancellableStatuses = ['pending', 'paid', 'processing'];
        if (!cancellableStatuses.includes(order.status)) {
            return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
        }

        const reason = req.body.reason || 'Cancelled by user';

        order = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'cancelled',
                cancelledAt: new Date(),
                cancelReason: reason,
                orderstatushistory: {
                    create: {
                        status: 'cancelled',
                        note: reason,
                        updatedById: req.user.id
                    }
                }
            }
        });

        // Restore stock
        for (const item of order.orderitem) {
            await prisma.product.update({
                where: { id: item.productId },
                data: { totalSold: { decrement: item.quantity } }
            });

            if (item.variant) {
                let variantData = typeof item.variant === 'string' ? JSON.parse(item.variant) : item.variant;
                if (variantData.sku) {
                    await prisma.variant.updateMany({
                        where: { sku: variantData.sku },
                        data: { stock: { increment: item.quantity } }
                    });
                }
            }
        }

        res.json(formatOrder(order));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get salesman's assigned orders
// @route   GET /api/orders/salesman
const getSalesmanOrders = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get products by this salesman
        const products = await prisma.product.findMany({
            where: { sellerId: req.user.id },
            select: { id: true }
        });
        const productIds = products.map(p => p.id);

        let whereClause = {
            orderitem: {
                some: { productId: { in: productIds } }
            }
        };

        if (req.query.status) whereClause.status = req.query.status;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: whereClause,
                include: {
                    user: { select: { name: true, email: true } },
                    orderitem: {
                        where: { productId: { in: productIds } }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.order.count({ where: whereClause })
        ]);

        res.json({
            orders: orders.map(formatOrder),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    assignDelivery,
    cancelOrder,
    getSalesmanOrders,
    formatOrder
};
