const { prisma } = require('../config/db');

class SearchService {
    // Full-text search with filters
    static async searchProducts(query) {
        const {
            keyword,
            category,
            minPrice,
            maxPrice,
            minRating,
            inStock,
            sort,
            page = 1,
            limit = 12
        } = query;

        const where = { isActive: true };

        // Text search
        if (keyword) {
            where.OR = [
                { name: { contains: keyword } },
                { description: { contains: keyword } },
                { brand: { contains: keyword } }
            ];
        }

        // Category filter
        if (category) {
            where.categoryId = category;
        }

        // Price range
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = Number(minPrice);
            if (maxPrice) where.price.lte = Number(maxPrice);
        }

        // Rating filter
        if (minRating) {
            where.avgRating = { gte: Number(minRating) };
        }

        // In stock filter
        if (inStock === 'true') {
            where.totalStock = { gt: 0 };
        }

        // Sorting
        let orderBy = {};
        switch (sort) {
            case 'price_asc':
                orderBy = { price: 'asc' };
                break;
            case 'price_desc':
                orderBy = { price: 'desc' };
                break;
            case 'rating':
                orderBy = { avgRating: 'desc' };
                break;
            case 'newest':
                orderBy = { createdAt: 'desc' };
                break;
            case 'best_selling':
                orderBy = { totalSold: 'desc' };
                break;
            case 'relevance':
            default:
                // Prisma doesn't directly support textScore sorting without native queries, so we fallback
                orderBy = { createdAt: 'desc' };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: Number(limit),
                include: {
                    category: {
                        select: { name: true, slug: true }
                    },
                    seller: {
                        select: { name: true }
                    }
                }
            }),
            prisma.product.count({ where })
        ]);

        return {
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        };
    }

    // Autocomplete suggestions
    static async getAutocompleteSuggestions(keyword, limit = 8) {
        if (!keyword || keyword.length < 2) return [];

        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: keyword } },
                    { tags: { contains: keyword } },
                    { brand: { contains: keyword } }
                ]
            },
            select: {
                name: true,
                slug: true,
                thumbnail: true,
                price: true
            },
            take: Number(limit)
        });

        return products;
    }

    // Get product recommendations
    static async getRecommendations(productId, limit = 8) {
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) return [];

        const recommendations = await prisma.product.findMany({
            where: {
                id: { not: productId },
                isActive: true,
                OR: [
                    { categoryId: product.categoryId },
                    // Tags in Prisma when stored as string might require custom logic,
                    // but we approximate by just using category for now if tags are complex.
                    ...(product.tags ? [{ tags: { contains: product.tags.split(',')[0].trim() } }] : [])
                ]
            },
            orderBy: [
                { avgRating: 'desc' },
                { totalSold: 'desc' }
            ],
            take: Number(limit),
            select: {
                name: true,
                slug: true,
                price: true,
                comparePrice: true,
                images: true,
                avgRating: true,
                numReviews: true
            }
        });

        return recommendations;
    }
}

module.exports = SearchService;
