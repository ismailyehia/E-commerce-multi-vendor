const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const { prisma } = require('../config/db');

const imageMap = {
    'Premium Wireless Headphones': '/uploads/products/headphones.png',
    'Ultra Slim Laptop Pro': '/uploads/products/laptop.png',
    'Smart Watch Series X': '/uploads/products/smartwatch.png',
    'Premium Cotton T-Shirt': '/uploads/products/tshirt.png',
    'Running Shoes AirMax': '/uploads/products/running-shoes.png',
    'Smartphone ProMax 15': '/uploads/products/smartphone.png',
    'Yoga Mat Premium': '/uploads/products/yoga-mat.png',
    'Skin Care Set Luxury': '/uploads/products/skincare.png',
};

const updateImages = async () => {
    try {
        console.log('Updating product images...');

        for (const [name, image] of Object.entries(imageMap)) {
            const product = await prisma.product.findFirst({ where: { name } });

            if (product) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { images: [image], thumbnail: image }
                });
                console.log(`${name}: ✅ Updated`);
            } else {
                console.log(`${name}: ⚠️ Not found`);
            }
        }

        console.log('\n✅ All product images updated!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

updateImages();
