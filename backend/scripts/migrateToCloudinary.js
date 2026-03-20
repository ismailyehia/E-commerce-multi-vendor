const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(localPath, folder) {
    try {
        // Resolve the full local path
        // The DB path is usually /uploads/...
        // We need to map it to the actual filesystem path
        const absolutePath = path.join(__dirname, '..', localPath);

        if (!fs.existsSync(absolutePath)) {
            console.log(`⚠️  File not found: ${absolutePath}`);
            return null;
        }

        console.log(`Uploading ${localPath}...`);
        const result = await cloudinary.uploader.upload(absolutePath, {
            folder: `ecommerce/${folder}`,
            use_filename: true,
            unique_filename: true,
        });

        return result.secure_url;
    } catch (error) {
        console.error(`❌ Upload failed for ${localPath}:`, error.message);
        return null;
    }
}

async function migrate() {
    try {
        console.log('--- Starting Migration ---');

        // Migrate Categories
        console.log('\nMigrating Categories...');
        const categories = await prisma.category.findMany();

        const catMapping = {
            "Beauty & Health": "beauty-health.png",
            "Electronics": "electronics.png",
            "Fashion": "fashion.png",
            "Headphones": "headphones.png",
            "Home & Garden": "home-garden.png",
            "Laptops": "laptops.png",
            "Men's Clothing": "mens-clothing.png",
            "Smartphones": "smartphones.png",
            "Sports & Outdoors": "sports-outdoors.png",
            "Women's Clothing": "womens-clothing.png"
        };

        for (const cat of categories) {
            let localPath = null;

            if (cat.image && cat.image.startsWith('/uploads')) {
                localPath = path.join('..', cat.image);
            } else if (catMapping[cat.name]) {
                // Look in frontend/public/categories
                localPath = path.join('..', '..', 'frontend', 'public', 'categories', catMapping[cat.name]);
            }

            if (localPath) {
                const absolutePath = path.resolve(__dirname, localPath);
                if (fs.existsSync(absolutePath)) {
                    console.log(`Uploading category ${cat.name}...`);
                    const result = await cloudinary.uploader.upload(absolutePath, {
                        folder: 'ecommerce/categories',
                        use_filename: true,
                        unique_filename: true,
                    });

                    await prisma.category.update({
                        where: { id: cat.id },
                        data: { image: result.secure_url }
                    });
                    console.log(`✅ Category "${cat.name}" updated with Cloudinary URL.`);
                } else {
                    console.log(`⚠️  Local file for "${cat.name}" not found at ${absolutePath}`);
                }
            }
        }

        // Migrate Products
        console.log('\nMigrating Products...');
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { thumbnail: { startsWith: '/uploads' } },
                    { images: { contains: '/uploads' } }
                ]
            }
        });

        for (const prod of products) {
            let updateData = {};

            // Handle thumbnail
            if (prod.thumbnail && prod.thumbnail.startsWith('/uploads')) {
                const cloudUrl = await uploadToCloudinary(prod.thumbnail, 'products');
                if (cloudUrl) updateData.thumbnail = cloudUrl;
            }

            // Handle images array
            if (prod.images) {
                let imagesArr = [];
                try {
                    imagesArr = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
                } catch (e) {
                    imagesArr = [];
                }

                if (Array.isArray(imagesArr)) {
                    const newImages = [];
                    for (const img of imagesArr) {
                        if (img.startsWith('/uploads')) {
                            const cloudUrl = await uploadToCloudinary(img, 'products');
                            newImages.push(cloudUrl || img);
                        } else {
                            newImages.push(img);
                        }
                    }
                    updateData.images = JSON.stringify(newImages);
                }
            }

            if (Object.keys(updateData).length > 0) {
                await prisma.product.update({
                    where: { id: prod.id },
                    data: updateData
                });
                console.log(`✅ Product "${prod.name}" updated.`);
            }
        }

        console.log('\n--- Migration Finished! ---');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
