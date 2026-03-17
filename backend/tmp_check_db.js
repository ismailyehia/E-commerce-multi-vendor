const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
    try {
        const u = await prisma.user.count();
        const p = await prisma.product.count();
        const c = await prisma.category.count();
        console.log(JSON.stringify({ users: u, products: p, categories: c }));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
