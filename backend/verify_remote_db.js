const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Database Verification ---');
        console.log('Connecting to database...');

        // Test connection
        await prisma.$connect();
        console.log('Connection successful!');

        const userCount = await prisma.user.count();
        console.log(`Total users in database: ${userCount}`);

        const admins = await prisma.user.findMany({
            where: { role: 'admin' },
            select: { id: true, name: true, email: true, role: true, isActive: true }
        });

        if (admins.length > 0) {
            console.log('Admin users found:');
            console.table(admins);
        } else {
            console.log('⚠️ No admin users found in the database.');
        }

        const allUsers = await prisma.user.findMany({
            take: 5,
            select: { email: true, role: true }
        });
        console.log('First 5 users (for verification):');
        console.table(allUsers);

    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
        if (error.message.includes('Can\'t reach database server')) {
            console.log('Tip: Check if your DATABASE_URL in .env is correct and the database server is running.');
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
