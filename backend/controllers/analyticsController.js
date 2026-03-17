const { prisma } = require('../config/db');
const { formatOrder } = require('./orderController');

const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [totalRevenueResult, todaySalesResult, totalOrders, totalCustomers, totalProducts, recentOrders] = await Promise.all([
            prisma.order.aggregate({
                where: { status: { notIn: ['cancelled', 'returned'] } },
                _sum: { totalPrice: true }
            }),
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: today },
                    status: { notIn: ['cancelled'] }
                },
                _sum: { totalPrice: true },
                _count: { id: true }
            }),
            prisma.order.count(),
            prisma.user.count({ where: { role: 'customer' } }),
            prisma.product.count({ where: { isActive: true } }),
            prisma.order.findMany({
                include: {
                    user: { select: { name: true } },
                    orderitem: true
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        ]);

        res.json({
            totalRevenue: totalRevenueResult._sum.totalPrice || 0,
            todaySales: todaySalesResult._sum.totalPrice || 0,
            todayOrders: todaySalesResult._count.id || 0,
            totalOrders,
            totalCustomers,
            totalProducts,
            recentOrders: recentOrders.map(formatOrder)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getSalesChart = async (req, res) => {
    try {
        const days = Number(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Prisma doesn't have a direct $dateToString equivalent in standard groupby
        // Pulling grouped by day requires a raw query or pulling and grouping in memory.
        // For simplicity and to avoid raw queries if possible, we'll fetch and group in memory
        // if dataset is small, or just use raw query. Let's use raw query for accuracy.

        const salesData = await prisma.$queryRaw`
            SELECT 
                DATE(createdAt) as _id, 
                SUM(totalPrice) as revenue, 
                COUNT(id) as orders
            FROM \`order\`
            WHERE createdAt >= ${startDate} AND status NOT IN ('cancelled')
            GROUP BY DATE(createdAt)
            ORDER BY _id ASC
        `;

        // Format dates back to string if needed by frontend
        const formattedData = salesData.map(d => ({
            _id: d._id, // Date might need formatting depending on mysql driver output
            revenue: Number(d.revenue),
            orders: Number(d.orders)
        }));

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getTopProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            orderBy: { totalSold: 'desc' },
            take: 10,
            select: { name: true, images: true, price: true, totalSold: true, avgRating: true }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getOrderStatusDistribution = async (req, res) => {
    try {
        const distribution = await prisma.order.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        const formatted = distribution.map(d => ({
            _id: d.status,
            count: d._count.id
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getRevenueByCategory = async (req, res) => {
    try {
        // Complex aggregation across tables. Best to use raw SQL here for performance and simplicity
        const revenue = await prisma.$queryRaw`
            SELECT c.name as _id, SUM(oi.price * oi.quantity) as revenue
            FROM \`orderitem\` oi
            JOIN \`product\` p ON oi.productId = p.id
            JOIN \`category\` c ON p.categoryId = c.id
            GROUP BY c.name
            ORDER BY revenue DESC
            LIMIT 10
        `;

        const formatted = revenue.map(r => ({
            _id: r._id,
            revenue: Number(r.revenue)
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getDashboardStats, getSalesChart, getTopProducts, getOrderStatusDistribution, getRevenueByCategory };
