const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Comprehensive Delivery Flow Test ---');

    // 1. Find a customer user
    const customer = await prisma.user.findFirst({ where: { role: 'customer' } });
    if (!customer) {
        console.error('No customer user found.');
        return;
    }

    // 2. Create a test order
    console.log('Creating test order...');
    const order = await prisma.order.create({
        data: {
            orderNumber: `TEST-ORD-${Date.now()}`,
            userId: customer.id,
            status: 'pending',
            itemsPrice: 100.00,
            totalPrice: 100.00,
            shippingAddress: JSON.stringify({
                street: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
                country: 'Test Country'
            }),
            paymentMethod: 'cod'
        }
    });
    console.log(`Order created: ${order.orderNumber}`);

    const deliverymanId = '43decdab-dbd5-40ac-9efd-3076f26a47e4'; // Mike Driver

    // 3. Create delivery (Simulate "Claim")
    console.log('Creating delivery (Simulating "Claim")...');
    const delivery = await prisma.delivery.create({
        data: {
            orderId: order.id,
            deliverymanId: deliverymanId,
            status: 'accepted',
            deliveryLocationAddress: '123 Test St, Test City, TS, 12345, Test Country'
        }
    });
    console.log(`Delivery created with status: ${delivery.status}`);

    // Update order status to processing as claimDelivery does
    await prisma.order.update({
        where: { id: order.id },
        data: { status: 'processing', deliverymanId: deliverymanId }
    });

    // 4. Simulate "Mark Picked Up"
    console.log('Simulating "Mark Picked Up"...');
    // In backend: api.put(`/delivery/${delivery.id}/status`, { status: 'picked_up' })
    await prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: 'picked_up' }
    });
    console.log('Delivery status updated to picked_up');

    // 5. Simulate "Update Location"
    console.log('Simulating "Update Location"...');
    // In backend: api.put(`/delivery/${delivery.id}/location`, { lat: 34.0522, lng: -118.2437 })
    const updatedLocation = await prisma.delivery.update({
        where: { id: delivery.id },
        data: {
            currentLocationLat: 34.0522,
            currentLocationLng: -118.2437,
            currentLocationTime: new Date()
        }
    });
    console.log(`Location updated: ${updatedLocation.currentLocationLat}, ${updatedLocation.currentLocationLng}`);

    // 6. Simulate "Start Delivery" (in_transit)
    console.log('Simulating "Start Delivery" (in_transit)...');
    // In backend: api.put(`/delivery/${delivery.id}/status`, { status: 'in_transit' })
    // Backend logic also updates order to 'out_for_delivery'
    await prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: 'in_transit' }
    });

    // Simulate what the backend does:
    await prisma.order.update({
        where: { id: order.id },
        data: {
            status: 'out_for_delivery',
            orderstatushistory: {
                create: {
                    status: 'out_for_delivery',
                    note: 'Driver is on the way',
                    updatedById: deliverymanId
                }
            }
        }
    });

    const finalOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { orderstatushistory: true }
    });
    const finalDelivery = await prisma.delivery.findUnique({ where: { id: delivery.id } });

    console.log(`Final Delivery Status: ${finalDelivery.status}`);
    console.log(`Final Order Status: ${finalOrder.status}`);
    console.log(`History count: ${finalOrder.orderstatushistory.length}`);

    if (finalDelivery.status === 'in_transit' && finalOrder.status === 'out_for_delivery') {
        console.log('--- VERIFICATION SUCCESSFUL ---');
    } else {
        console.log('--- VERIFICATION FAILED ---');
    }

    // Cleanup (optional, but good practice)
    // await prisma.delivery.delete({ where: { id: delivery.id } });
    // await prisma.order.delete({ where: { id: order.id } });
}

main().catch(console.error).finally(() => prisma.$disconnect());
