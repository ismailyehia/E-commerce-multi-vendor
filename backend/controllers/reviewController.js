const { prisma } = require('../config/db');

// @desc    Get product reviews
// @route   GET /api/reviews/product/:productId
const getProductReviews = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const whereClause = { productId: req.params.productId, isApproved: true };
        const orderBy = req.query.sort === 'helpful' ? { helpfulVotes: 'desc' } : { createdAt: 'desc' };

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: whereClause,
                include: { user: { select: { name: true, avatar: true } } },
                orderBy,
                skip,
                take: limit
            }),
            prisma.review.count({ where: whereClause })
        ]);

        // Get rating distribution
        const distributionQuery = await prisma.review.groupBy({
            by: ['rating'],
            where: { productId: req.params.productId, isApproved: true },
            _count: { rating: true },
            orderBy: { rating: 'desc' }
        });

        const distribution = distributionQuery.reduce((acc, d) => {
            acc[d.rating] = d._count.rating;
            return acc;
        }, {});

        res.json({
            reviews,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            distribution
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create review
// @route   POST /api/reviews
const createReview = async (req, res) => {
    try {
        const { productId, rating, title, comment } = req.body;

        // Check if already reviewed
        const existing = await prisma.review.findFirst({
            where: { userId: req.user.id, productId }
        });

        if (existing) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        // Check if verified purchase
        const hasPurchased = await prisma.order.findFirst({
            where: {
                userId: req.user.id,
                status: 'delivered',
                items: { some: { productId } }
            }
        });

        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(f => `/uploads/reviews/${f.filename}`);
        }

        const review = await prisma.review.create({
            data: {
                userId: req.user.id,
                productId,
                rating: parseInt(rating),
                title,
                comment,
                isVerifiedPurchase: !!hasPurchased,
                images
            },
            include: { user: { select: { name: true, avatar: true } } }
        });

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Vote on review
// @route   POST /api/reviews/:id/vote
const voteReview = async (req, res) => {
    try {
        const { vote } = req.body; // 'helpful' or 'not_helpful'
        const review = await prisma.review.findUnique({
            where: { id: req.params.id }
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if user already voted (Assuming we parse the JSON array of voters)
        let voters = typeof review.voters === 'string' ? JSON.parse(review.voters) : (review.voters || []);

        const existingVote = voters.find(v => v.user === req.user.id);
        if (existingVote) {
            return res.status(400).json({ message: 'You already voted on this review' });
        }

        voters.push({ user: req.user.id, vote });

        const updateData = { voters };
        if (vote === 'helpful') {
            updateData.helpfulVotes = { increment: 1 };
        } else {
            updateData.notHelpfulVotes = { increment: 1 };
        }

        const updatedReview = await prisma.review.update({
            where: { id: review.id },
            data: updateData
        });

        res.json({
            helpfulVotes: updatedReview.helpfulVotes,
            notHelpfulVotes: updatedReview.notHelpfulVotes
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
    try {
        const review = await prisma.review.findUnique({
            where: { id: req.params.id }
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Only reviewer or admin can delete
        if (review.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await prisma.review.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Moderate review (admin)
// @route   PUT /api/reviews/:id/moderate
const moderateReview = async (req, res) => {
    try {
        const { isApproved } = req.body;

        const parsedIsApproved = typeof isApproved === 'string' ? isApproved === 'true' : isApproved;

        const review = await prisma.review.update({
            where: { id: req.params.id },
            data: { isApproved: parsedIsApproved },
            include: { user: { select: { name: true } } }
        });

        res.json(review);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all reviews (admin)
// @route   GET /api/reviews/admin
const getAllReviews = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let whereClause = {};
        if (req.query.approved === 'false') whereClause.isApproved = false;
        if (req.query.approved === 'true') whereClause.isApproved = true;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: whereClause,
                include: {
                    user: { select: { name: true, email: true } },
                    product: { select: { name: true, slug: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.review.count({ where: whereClause })
        ]);

        res.json({
            reviews,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getProductReviews,
    createReview,
    voteReview,
    deleteReview,
    moderateReview,
    getAllReviews
};
