const { prisma } = require('../config/db');

// @desc    Get active ads by placement
// @route   GET /api/ads
const getAds = async (req, res) => {
    try {
        const { placement } = req.query;
        const now = new Date();

        const whereClause = {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now }
        };

        if (placement) whereClause.placement = placement;

        const ads = await prisma.ad.findMany({
            where: whereClause,
            include: {
                product: { select: { name: true, slug: true, price: true, images: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Increment impressions
        if (ads.length > 0) {
            const adIds = ads.map(a => a.id);
            await prisma.ad.updateMany({
                where: { id: { in: adIds } },
                data: { impressions: { increment: 1 } }
            });
        }

        res.json(ads);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Click ad (track)
// @route   POST /api/ads/:id/click
const clickAd = async (req, res) => {
    try {
        await prisma.ad.update({
            where: { id: req.params.id },
            data: { clicks: { increment: 1 } }
        });
        res.json({ message: 'Click tracked' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all ads (admin)
// @route   GET /api/ads/admin
const getAllAds = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [ads, total] = await Promise.all([
            prisma.ad.findMany({
                include: {
                    product: { select: { name: true } },
                    createdBy: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.ad.count()
        ]);

        res.json({
            ads,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create ad
// @route   POST /api/ads
const createAd = async (req, res) => {
    try {
        const adData = { ...req.body, createdById: req.user.id };

        if (req.file) {
            adData.media = req.file.path;
        }

        if (adData.budget) adData.budget = parseFloat(adData.budget);

        // Ensure dates are parsed correctly
        if (adData.startDate) adData.startDate = new Date(adData.startDate);
        if (adData.endDate) adData.endDate = new Date(adData.endDate);

        const ad = await prisma.ad.create({
            data: adData
        });
        res.status(201).json(ad);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update ad
// @route   PUT /api/ads/:id
const updateAd = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (req.file) {
            updateData.media = req.file.path;
        }

        if (updateData.budget) updateData.budget = parseFloat(updateData.budget);
        if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
        if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

        if (typeof updateData.isActive !== 'undefined') {
            updateData.isActive = typeof updateData.isActive === 'string' ? updateData.isActive === 'true' : updateData.isActive;
        }

        const ad = await prisma.ad.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(ad);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Ad not found' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete ad
// @route   DELETE /api/ads/:id
const deleteAd = async (req, res) => {
    try {
        await prisma.ad.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Ad deleted' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Ad not found' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get ad analytics
// @route   GET /api/ads/:id/analytics
const getAdAnalytics = async (req, res) => {
    try {
        const ad = await prisma.ad.findUnique({
            where: { id: req.params.id }
        });

        if (!ad) {
            return res.status(404).json({ message: 'Ad not found' });
        }

        const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0;
        const costPerClick = ad.clicks > 0 ? (ad.spent / ad.clicks).toFixed(2) : 0;

        res.json({
            title: ad.title,
            type: ad.type,
            placement: ad.placement,
            impressions: ad.impressions,
            clicks: ad.clicks,
            ctr: `${ctr}%`,
            budget: ad.budget,
            spent: ad.spent,
            costPerClick: `$${costPerClick}`,
            startDate: ad.startDate,
            endDate: ad.endDate,
            isActive: ad.isActive
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getAds,
    clickAd,
    getAllAds,
    createAd,
    updateAd,
    deleteAd,
    getAdAnalytics
};
