
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mapping = {
    "03325686-22cb-4134-a2da-530ea7c14c02": "/categories/sports-outdoors.png",
    "409c03f7-22fd-4f10-93f4-b068e8020229": "/categories/womens-clothing.png",
    "6b3772ce-7a81-4824-81e7-4a0e004410a0": "/categories/fashion.png",
    "7d56940d-671b-464e-961c-3911d5def497": "/categories/laptops.png",
    "8013ce36-cf7f-4a7b-8f6e-6b08f2df159d": "/categories/mens-clothing.png",
    "8b49235f-9608-49c0-8031-57acdfe47d2a": "/categories/beauty-health.png",
    "8d1d1a77-44e0-4453-b144-ccd093cc30a8": "/categories/headphones.png",
    "96a5454e-072d-4a20-96d8-5e838b455be9": "/categories/smartphones.png",
    "c4077b40-349b-4711-8c3b-bd59b880bc9e": "/categories/electronics.png",
    "ce886a25-1f2e-4914-929e-ec8abcf6d49f": "/categories/home-garden.png"
};

async function updateCategories() {
    try {
        for (const [id, imagePath] of Object.entries(mapping)) {
            await prisma.category.update({
                where: { id },
                data: { image: imagePath }
            });
            console.log(`Updated category ${id} with image ${imagePath}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

updateCategories();
