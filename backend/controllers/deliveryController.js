const { prisma } = require('../config/db');

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

// @desc    Get assigned deliveries
// @route   GET /api/delivery/assigned
const getAssignedDeliveries = async (req, res) => {
    try {
        const filter = { deliverymanId: req.user.id };
        if (req.query.status) filter.status = req.query.status;

        const deliveries = await prisma.delivery.findMany({
            where: filter,
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        orderitem: true,
                        shippingAddress: true,
                        totalPrice: true,
                        status: true,
                        user: { select: { name: true, phone: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedDeliveries = deliveries.map(d => ({
            ...d,
            order: formatOrder(d.order)
        }));

        res.json(formattedDeliveries);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get delivery by ID
// @route   GET /api/delivery/:id
const getDeliveryById = async (req, res) => {
    try {
        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        const formattedDelivery = {
            ...delivery,
            order: formatOrder(delivery.order)
        };

        res.json(formattedDelivery);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Accept delivery
// @route   PUT /api/delivery/:id/accept
const acceptDelivery = async (req, res) => {
    try {
        const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id } });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        if (delivery.deliverymanId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updatedDelivery = await prisma.delivery.update({
            where: { id: req.params.id },
            data: { status: 'accepted' }
        });

        res.json(updatedDelivery);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update delivery status
// @route   PUT /api/delivery/:id/status
const updateDeliveryStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const deliveryId = req.params.id;

        const delivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
            include: { order: { include: { user: { select: { id: true, name: true, email: true } } } } }
        });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        const updateData = { status };
        if (notes) updateData.notes = notes;

        if (status === 'delivered') {
            updateData.actualDeliveryTime = new Date();
        }

        const updatedDelivery = await prisma.delivery.update({
            where: { id: deliveryId },
            data: updateData
        });

        if (status === 'delivered') {
            await prisma.order.update({
                where: { id: delivery.orderId },
                data: {
                    status: 'delivered',
                    deliveredAt: new Date(),
                    orderstatushistory: {
                        create: {
                            status: 'delivered',
                            timestamp: new Date(),
                            note: 'Delivered by driver',
                            updatedById: req.user.id
                        }
                    }
                }
            });
        }

        if (status === 'in_transit') {
            await prisma.order.update({
                where: { id: delivery.orderId },
                data: {
                    status: 'out_for_delivery',
                    orderstatushistory: {
                        create: {
                            status: 'out_for_delivery',
                            timestamp: new Date(),
                            note: 'Driver is on the way',
                            updatedById: req.user.id
                        }
                    }
                }
            });
        }

        // Notify customer
        if (delivery.order && delivery.order.user) {
            await prisma.notification.create({
                data: {
                    userId: delivery.order.user.id,
                    type: 'delivery',
                    title: 'Delivery Update',
                    message: `Your delivery is now: ${status.replace(/_/g, ' ')}`,
                    data: JSON.stringify({ deliveryId: delivery.id, orderId: delivery.orderId })
                }
            });
        }

        res.json(updatedDelivery);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update driver location or destination
// @route   PUT /api/delivery/:id/location
const updateLocation = async (req, res) => {
    try {
        const { lat, lng, isDestination } = req.body;

        const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id } });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        const data = {};
        if (isDestination) {
            data.deliveryLocationLat = lat;
            data.deliveryLocationLng = lng;
        } else {
            data.currentLocationLat = lat;
            data.currentLocationLng = lng;
            data.currentLocationTime = new Date();
            data.deliveryroutepoint = {
                create: { lat, lng, timestamp: new Date() }
            };
        }

        const updatedDelivery = await prisma.delivery.update({
            where: { id: req.params.id },
            data
        });

        res.json({
            message: isDestination ? 'Destination updated' : 'Location updated',
            currentLocation: { lat: updatedDelivery.currentLocationLat, lng: updatedDelivery.currentLocationLng, updatedAt: updatedDelivery.currentLocationTime },
            deliveryLocation: { lat: updatedDelivery.deliveryLocationLat, lng: updatedDelivery.deliveryLocationLng }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get driver location (for customer tracking)
// @route   GET /api/delivery/track/:orderId
const getDriverLocation = async (req, res) => {
    try {
        const delivery = await prisma.delivery.findFirst({
            where: { orderId: req.params.orderId },
            select: {
                currentLocationLat: true,
                currentLocationLng: true,
                currentLocationTime: true,
                status: true,
                estimatedDeliveryTime: true,
                deliveryLocationLat: true,
                deliveryLocationLng: true,
                deliveryLocationAddress: true,
                deliveryman: { select: { name: true, phone: true } }
            }
        });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery tracking not found' });
        }

        const formattedDelivery = {
            status: delivery.status,
            estimatedDeliveryTime: delivery.estimatedDeliveryTime,
            deliveryLocation: {
                lat: delivery.deliveryLocationLat,
                lng: delivery.deliveryLocationLng,
                address: delivery.deliveryLocationAddress
            },
            currentLocation: {
                lat: delivery.currentLocationLat,
                lng: delivery.currentLocationLng,
                updatedAt: delivery.currentLocationTime
            },
            deliveryman: delivery.deliveryman
        };

        res.json(formattedDelivery);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Upload delivery proof
// @route   POST /api/delivery/:id/proof
const uploadProof = async (req, res) => {
    try {
        const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id } });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        let updatedDelivery = delivery;
        if (req.file) {
            const proofImage = `/uploads/deliveries/${req.file.filename}`;
            updatedDelivery = await prisma.delivery.update({
                where: { id: req.params.id },
                data: { proofImage }
            });
        }

        res.json({ message: 'Proof uploaded', proofImage: updatedDelivery.proofImage });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all deliveries (admin)
// @route   GET /api/delivery/all
const getAllDeliveries = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.status) filter.status = req.query.status;

        const [deliveries, total] = await Promise.all([
            prisma.delivery.findMany({
                where: filter,
                include: {
                    order: { select: { orderNumber: true, totalPrice: true, status: true } },
                    deliveryman: { select: { name: true, phone: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.delivery.count({ where: filter })
        ]);

        res.json({
            deliveries,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get available deliveries (unassigned orders)
// @route   GET /api/delivery/available
const getAvailableDeliveries = async (req, res) => {
    try {
        // Find orders that are ready for delivery but have no delivery record
        // Ready means status is 'paid' (for online payment) or 'pending' (for COD)
        const orders = await prisma.order.findMany({
            where: {
                status: { in: ['pending', 'paid', 'processing'] },
                delivery: { none: {} }
            },
            include: {
                user: { select: { name: true, phone: true } },
                orderitem: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedOrders = orders.map(formatOrder);
        res.json(formattedOrders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Claim an order for delivery
// @route   POST /api/delivery/claim/:orderId
const claimDelivery = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Check if order exists and is available
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { delivery: true }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.delivery.length > 0) {
            return res.status(400).json({ message: 'Order already assigned or claimed' });
        }

        // Create delivery record
        const delivery = await prisma.delivery.create({
            data: {
                orderId,
                deliverymanId: req.user.id,
                status: 'accepted', // Auto-accept when claimed
                deliveryLocationAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : JSON.stringify(order.shippingAddress)
            }
        });

        // Update order status and assign deliveryman
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'processing',
                deliverymanId: req.user.id,
                orderstatushistory: {
                    create: {
                        status: 'processing',
                        note: 'Order claimed by deliveryman',
                        updatedById: req.user.id
                    }
                }
            }
        });

        res.json({ message: 'Order claimed successfully', delivery });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getAssignedDeliveries,
    getDeliveryById,
    acceptDelivery,
    updateDeliveryStatus,
    updateLocation,
    getDriverLocation,
    uploadProof,
    getAllDeliveries,
    getAvailableDeliveries,
    claimDelivery
};
