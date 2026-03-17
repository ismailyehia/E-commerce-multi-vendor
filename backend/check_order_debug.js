
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrder(orderNumber) {
    try {
        const order = await prisma.order.findUnique({
            where: { orderNumber },
            include: { delivery: true }
        });
        if (order) {
            console.log('Order ID:', order.id);
            console.log('Order Status:', order.status);
            if (order.delivery && order.delivery.length > 0) {
                const d = order.delivery[0];
                console.log('Delivery ID:', d.id);
                console.log('Delivery Data:', {
                    currentLocationLat: d.currentLocationLat,
                    currentLocationLng: d.currentLocationLng,
                    deliveryLocationLat: d.deliveryLocationLat,
                    deliveryLocationLng: d.deliveryLocationLng
                });
            } else {
                console.log('No delivery record found for this order.');
            }
        } else {
            console.log('Order not found.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrder('ORD-1773438334589-00005');
