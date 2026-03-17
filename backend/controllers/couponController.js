const { prisma } = require('../config/db');

const getCoupons = async (req, res) => {
    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: { select: { name: true, email: true } }
            }
        });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createCoupon = async (req, res) => {
    try {
        const couponData = { ...req.body, createdById: req.user.id };

        if (couponData.code) {
            couponData.code = couponData.code.toUpperCase();
        }

        const coupon = await prisma.coupon.create({
            data: couponData
        });
        res.status(201).json(coupon);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ message: 'Coupon code already exists' });
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateCoupon = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (updateData.code) {
            updateData.code = updateData.code.toUpperCase();
        }

        const coupon = await prisma.coupon.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(coupon);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        await prisma.coupon.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Coupon deleted' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const coupon = await prisma.coupon.findFirst({
            where: {
                code: code.toUpperCase(),
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() }
            }
        });

        if (!coupon) return res.status(400).json({ message: 'Invalid or expired coupon' });
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
            return res.status(400).json({ message: 'Coupon usage limit reached' });

        res.json({ valid: true, type: coupon.type, value: coupon.value, minOrderAmount: coupon.minOrderAmount, maxDiscount: coupon.maxDiscount });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon };
