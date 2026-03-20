
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            select: { name: true, id: true, image: true }
        });
        console.log(JSON.stringify(categories));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

getCategories();
