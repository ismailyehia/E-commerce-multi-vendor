const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    return formatted;
};

async function main() {
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

    console.log('Available orders count:', orders.length);
    console.log('Formatted orders:', JSON.stringify(orders.map(formatOrder), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
