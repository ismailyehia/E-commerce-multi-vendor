const { prisma } = require('../config/db');
const { sendPaymentConfirmation } = require('../utils/emailService');

// @desc    Create Stripe payment intent
// @route   POST /api/payments/stripe/create-intent
const createStripeIntent = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.userId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Initialize Stripe
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.totalPrice * 100), // Stripe uses cents
            currency: 'usd',
            metadata: {
                orderId: order.id,
                orderNumber: order.orderNumber
            }
        });

        // Create payment record
        await prisma.payment.create({
            data: {
                orderId: order.id,
                userId: req.user.id,
                method: 'stripe',
                transactionId: paymentIntent.id,
                amount: order.totalPrice,
                status: 'pending',
                metadata: JSON.stringify({ clientSecret: paymentIntent.client_secret })
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        res.status(500).json({ message: 'Payment error', error: error.message });
    }
};

// @desc    Stripe webhook
// @route   POST /api/payments/stripe/webhook
const stripeWebhook = async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        const payment = await prisma.payment.findUnique({
            where: { transactionId: paymentIntent.id }
        });

        if (payment) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'completed' }
            });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true }
        });

        if (order) {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'paid',
                    paidAt: new Date(),
                    paymentResult: JSON.stringify({
                        id: paymentIntent.id,
                        status: 'completed',
                        updateTime: new Date().toISOString()
                    }),
                    statusHistory: {
                        create: {
                            status: 'paid',
                            note: 'Payment confirmed via Stripe'
                        }
                    }
                }
            });

            if (order.user && order.user.email) {
                sendPaymentConfirmation(order.user, { amount: order.totalPrice, transactionId: paymentIntent.id });

                await prisma.notification.create({
                    data: {
                        userId: order.userId,
                        type: 'payment',
                        title: 'Payment Confirmed',
                        message: `Payment for order ${order.orderNumber} confirmed`,
                        data: JSON.stringify({ orderId: order.id })
                    }
                });
            }
        }
    }

    res.json({ received: true });
};

// @desc    Create PayPal order
// @route   POST /api/payments/paypal/create
const createPayPalOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // PayPal order creation would go here
        // For now, return a mock response that the frontend can use
        const paypalOrder = {
            id: `PAYPAL-${Date.now()}`,
            status: 'CREATED',
            amount: order.totalPrice
        };

        await prisma.payment.create({
            data: {
                orderId: order.id,
                userId: req.user.id,
                method: 'paypal',
                transactionId: paypalOrder.id,
                amount: order.totalPrice,
                status: 'pending'
            }
        });

        res.json(paypalOrder);
    } catch (error) {
        res.status(500).json({ message: 'Payment error', error: error.message });
    }
};

// @desc    Capture PayPal payment
// @route   POST /api/payments/paypal/capture
const capturePayPal = async (req, res) => {
    try {
        const { paypalOrderId, orderId } = req.body;

        const payment = await prisma.payment.findUnique({
            where: { transactionId: paypalOrderId }
        });

        if (payment) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'completed' }
            });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (order) {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'paid',
                    paidAt: new Date(),
                    paymentResult: {
                        id: paypalOrderId,
                        status: 'completed',
                        updateTime: new Date().toISOString()
                    },
                    statusHistory: {
                        create: {
                            status: 'paid',
                            note: 'Payment confirmed via PayPal'
                        }
                    }
                }
            });
        }

        res.json({ message: 'Payment captured successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Payment error', error: error.message });
    }
};

// @desc    Process refund
// @route   POST /api/payments/refund
const processRefund = async (req, res) => {
    try {
        const { orderId, amount, reason } = req.body;

        const payment = await prisma.payment.findFirst({
            where: { orderId: orderId, status: 'completed' }
        });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const refundAmount = amount || payment.amount;

        if (payment.method === 'stripe' && payment.transactionId) {
            try {
                const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
                await stripe.refunds.create({
                    payment_intent: payment.transactionId,
                    amount: Math.round(refundAmount * 100)
                });
            } catch (err) {
                console.error('Stripe refund error:', err);
            }
        }

        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: refundAmount >= payment.amount ? 'refunded' : 'partially_refunded',
                refundAmount: refundAmount,
                refundReason: reason
            }
        });

        const updatedPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
        res.json({ message: 'Refund processed', payment: updatedPayment });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get payment by order
// @route   GET /api/payments/order/:orderId
const getPaymentByOrder = async (req, res) => {
    try {
        const payment = await prisma.payment.findFirst({
            where: { orderId: req.params.orderId },
            include: {
                order: { select: { orderNumber: true, totalPrice: true } }
            }
        });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createStripeIntent,
    stripeWebhook,
    createPayPalOrder,
    capturePayPal,
    processRefund,
    getPaymentByOrder
};
