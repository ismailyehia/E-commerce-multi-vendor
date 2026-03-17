const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

const seedData = async () => {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();

        console.log('Clearing existing data (in reverse dependency order)...');
        // Delete in reverse dependency order to avoid foreign key constraints
        await prisma.reviewvote.deleteMany({});
        await prisma.review.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.deliveryroutepoint.deleteMany({});
        await prisma.delivery.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.cartitem.deleteMany({});
        await prisma.cart.deleteMany({});
        await prisma.orderstatushistory.deleteMany({});
        await prisma.orderitem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.ad.deleteMany({});
        await prisma.variant.deleteMany({});
        await prisma.recentlyviewed.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.category.deleteMany({});
        await prisma.coupon.deleteMany({});
        await prisma.address.deleteMany({});
        await prisma.user.deleteMany({});

        // Create Users
        console.log('Creating users...');
        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);
        const salesmanPassword = await bcrypt.hash('salesman123', salt);
        const deliveryPassword = await bcrypt.hash('delivery123', salt);
        const customerPassword = await bcrypt.hash('customer123', salt);

        const updateTime = new Date();

        const admin = await prisma.user.create({ data: { id: uuidv4(), name: 'Admin User', email: 'admin@ecommerce.com', password: adminPassword, role: 'admin', phone: '+1234567890', updatedAt: updateTime } });
        const salesman = await prisma.user.create({ data: { id: uuidv4(), name: 'John Vendor', email: 'salesman@ecommerce.com', password: salesmanPassword, role: 'salesman', phone: '+1234567891', updatedAt: updateTime } });
        const delivery = await prisma.user.create({ data: { id: uuidv4(), name: 'Mike Driver', email: 'delivery@ecommerce.com', password: deliveryPassword, role: 'deliveryman', phone: '+1234567892', updatedAt: updateTime } });
        const customer = await prisma.user.create({
            data: {
                id: uuidv4(),
                name: 'Jane Customer',
                email: 'customer@ecommerce.com',
                password: customerPassword,
                role: 'customer',
                phone: '+1234567893',
                updatedAt: updateTime,
                address: {
                    create: [{ id: uuidv4(), label: 'Home', fullName: 'Jane Customer', phone: '+1234567893', street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', country: 'US', isDefault: true }]
                }
            }
        });

        // Create Categories
        console.log('Creating categories...');
        const electronics = await prisma.category.create({ data: { id: uuidv4(), name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories', icon: '💻', updatedAt: updateTime } });
        const fashion = await prisma.category.create({ data: { id: uuidv4(), name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories', icon: '👕', updatedAt: updateTime } });
        const home = await prisma.category.create({ data: { id: uuidv4(), name: 'Home & Garden', slug: 'home-and-garden', description: 'Home decor and garden supplies', icon: '🏡', updatedAt: updateTime } });
        const sports = await prisma.category.create({ data: { id: uuidv4(), name: 'Sports & Outdoors', slug: 'sports-and-outdoors', description: 'Sports equipment and outdoor gear', icon: '⚽', updatedAt: updateTime } });
        const beauty = await prisma.category.create({ data: { id: uuidv4(), name: 'Beauty & Health', slug: 'beauty-and-health', description: 'Beauty products and health items', icon: '💄', updatedAt: updateTime } });

        // Subcategories
        const phones = await prisma.category.create({ data: { id: uuidv4(), name: 'Smartphones', slug: 'smartphones', parentId: electronics.id, updatedAt: updateTime } });
        const laptops = await prisma.category.create({ data: { id: uuidv4(), name: 'Laptops', slug: 'laptops', parentId: electronics.id, updatedAt: updateTime } });
        const headphones = await prisma.category.create({ data: { id: uuidv4(), name: 'Headphones', slug: 'headphones', parentId: electronics.id, updatedAt: updateTime } });
        const mensFashion = await prisma.category.create({ data: { id: uuidv4(), name: "Men's Clothing", slug: 'mens-clothing', parentId: fashion.id, updatedAt: updateTime } });
        const womensFashion = await prisma.category.create({ data: { id: uuidv4(), name: "Women's Clothing", slug: 'womens-clothing', parentId: fashion.id, updatedAt: updateTime } });

        // Create Products
        console.log('Creating products...');

        await prisma.product.create({
            data: {
                id: uuidv4(), name: 'Premium Wireless Headphones', slug: 'premium-wireless-headphones', description: 'High-quality noise-cancelling wireless headphones with 30-hour battery life.', shortDescription: 'Noise-cancelling wireless headphones', price: 199.99, comparePrice: 299.99, categoryId: electronics.id, subcategoryId: headphones.id, sellerId: salesman.id, images: '["/uploads/products/headphones.png"]', tags: '["headphones","wireless","noise-cancelling","bluetooth"]', brand: 'AudioPro', isFeatured: true, metaTitle: 'Premium Wireless Headphones - AudioPro', metaDescription: 'Shop premium noise-cancelling wireless headphones with 30hr battery', updatedAt: updateTime,
                variants: {
                    create: [
                        { id: uuidv4(), size: 'One Size', color: 'Black', sku: 'HP-BLK-001', stock: 50, price: 199.99 },
                        { id: uuidv4(), size: 'One Size', color: 'White', sku: 'HP-WHT-001', stock: 30, price: 199.99 },
                        { id: uuidv4(), size: 'One Size', color: 'Navy', sku: 'HP-NVY-001', stock: 20, price: 209.99 }
                    ]
                }
            }
        });

        await prisma.product.create({
            data: {
                id: uuidv4(), name: 'Ultra Slim Laptop Pro', slug: 'ultra-slim-laptop-pro', description: 'Ultra-thin and lightweight laptop with 15.6" 4K display, Intel i7 processor, 16GB RAM, and 512GB SSD.', shortDescription: '15.6" 4K ultra-slim laptop', price: 1299.99, comparePrice: 1599.99, categoryId: electronics.id, subcategoryId: laptops.id, sellerId: salesman.id, images: '["/uploads/products/laptop.png"]', tags: '["laptop","4k","ultrabook","professional"]', brand: 'TechVision', isFeatured: true, updatedAt: updateTime,
                variants: {
                    create: [
                        { id: uuidv4(), size: '16GB/512GB', color: 'Silver', sku: 'LP-SLV-001', stock: 25, price: 1299.99 },
                        { id: uuidv4(), size: '32GB/1TB', color: 'Space Gray', sku: 'LP-GRY-001', stock: 15, price: 1599.99 }
                    ]
                }
            }
        });

        await prisma.product.create({
            data: {
                id: uuidv4(), name: 'Smart Watch Series X', slug: 'smart-watch-series-x', description: 'Advanced smartwatch with heart rate monitoring, GPS, water resistance up to 50m, and 7-day battery life.', price: 349.99, comparePrice: 449.99, categoryId: electronics.id, sellerId: salesman.id, images: '["/uploads/products/smartwatch.png"]', tags: '["smartwatch","fitness","gps","health"]', brand: 'WristTech', isFeatured: true, updatedAt: updateTime,
                variants: {
                    create: [
                        { id: uuidv4(), size: '40mm', color: 'Black', sku: 'SW-BLK-40', stock: 40, price: 349.99 },
                        { id: uuidv4(), size: '44mm', color: 'Silver', sku: 'SW-SLV-44', stock: 35, price: 379.99 }
                    ]
                }
            }
        });

        await prisma.product.create({
            data: {
                id: uuidv4(), name: 'Premium Cotton T-Shirt', slug: 'premium-cotton-t-shirt', description: 'Ultra-soft 100% organic cotton t-shirt. Pre-shrunk, breathable fabric with a modern relaxed fit.', price: 29.99, comparePrice: 49.99, categoryId: fashion.id, subcategoryId: mensFashion.id, sellerId: salesman.id, images: '["/uploads/products/tshirt.png"]', tags: '["t-shirt","cotton","organic","casual"]', brand: 'EcoWear', updatedAt: updateTime,
                variants: {
                    create: [
                        { id: uuidv4(), size: 'S', color: 'White', sku: 'TS-WHT-S', stock: 100 },
                        { id: uuidv4(), size: 'M', color: 'White', sku: 'TS-WHT-M', stock: 100 },
                        { id: uuidv4(), size: 'L', color: 'White', sku: 'TS-WHT-L', stock: 80 },
                        { id: uuidv4(), size: 'M', color: 'Black', sku: 'TS-BLK-M', stock: 90 },
                        { id: uuidv4(), size: 'L', color: 'Black', sku: 'TS-BLK-L', stock: 70 }
                    ]
                }
            }
        });

        await prisma.product.create({
            data: {
                id: uuidv4(), name: 'Running Shoes AirMax', slug: 'running-shoes-airmax', description: 'Lightweight running shoes with responsive cushioning, breathable mesh upper, and durable rubber outsole.', price: 129.99, comparePrice: 169.99, categoryId: sports.id, sellerId: salesman.id, images: '["/uploads/products/running-shoes.png"]', tags: '["shoes","running","sports","fitness"]', brand: 'SprintX', isFeatured: true, updatedAt: updateTime,
                variants: {
                    create: [
                        { id: uuidv4(), size: '9', color: 'Grey/Orange', sku: 'RS-GO-9', stock: 45 },
                        { id: uuidv4(), size: '10', color: 'Grey/Orange', sku: 'RS-GO-10', stock: 50 },
                        { id: uuidv4(), size: '11', color: 'Black/Red', sku: 'RS-BR-11', stock: 30 }
                    ]
                }
            }
        });

        await prisma.product.create({
            data: {
                id: uuidv4(), name: 'Smartphone ProMax 15', slug: 'smartphone-promax-15', description: 'Latest flagship smartphone with 6.7" OLED display, triple camera system, A17 chip, 256GB storage.', price: 999.99, comparePrice: 1099.99, categoryId: electronics.id, subcategoryId: phones.id, sellerId: salesman.id, images: '["/uploads/products/smartphone.png"]', tags: '["smartphone","flagship","camera","5g"]', brand: 'PhoneTech', isFeatured: true, updatedAt: updateTime,
                variants: {
                    create: [
                        { id: uuidv4(), size: '256GB', color: 'Midnight', sku: 'SP-MID-256', stock: 60, price: 999.99 },
                        { id: uuidv4(), size: '512GB', color: 'Gold', sku: 'SP-GLD-512', stock: 30, price: 1199.99 }
                    ]
                }
            }
        });

        await prisma.product.create({
            data: {
                id: uuidv4(), name: 'Yoga Mat Premium', slug: 'yoga-mat-premium', description: 'Extra thick non-slip yoga mat with alignment lines. Made from eco-friendly TPE material.', price: 49.99, categoryId: sports.id, sellerId: salesman.id, images: '["/uploads/products/yoga-mat.png"]', tags: '["yoga","fitness","mat","exercise"]', brand: 'ZenFit', updatedAt: updateTime,
                variants: {
                    create: [
                        { id: uuidv4(), size: '6mm', color: 'Purple', sku: 'YM-PUR-6', stock: 80 },
                        { id: uuidv4(), size: '8mm', color: 'Blue', sku: 'YM-BLU-8', stock: 60 }
                    ]
                }
            }
        });

        await prisma.product.create({
            data: {
                id: uuidv4(), name: 'Skin Care Set Luxury', slug: 'skin-care-set-luxury', description: 'Complete luxury skincare routine set including cleanser, toner, serum, moisturizer, and eye cream.', price: 89.99, comparePrice: 149.99, categoryId: beauty.id, sellerId: salesman.id, images: '["/uploads/products/skincare.png"]', tags: '["skincare","beauty","luxury","set"]', brand: 'GlowUp', updatedAt: updateTime,
                variants: {
                    create: [
                        { id: uuidv4(), size: 'Standard Set', color: 'Default', sku: 'SC-STD-001', stock: 70 },
                        { id: uuidv4(), size: 'Deluxe Set', color: 'Default', sku: 'SC-DLX-001', stock: 40, price: 129.99 }
                    ]
                }
            }
        });

        // Create Coupons
        console.log('Creating coupons...');
        await prisma.coupon.createMany({
            data: [
                { id: uuidv4(), code: 'WELCOME10', type: 'percentage', value: 10, minOrderAmount: 50, startDate: new Date(), endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), createdById: admin.id, updatedAt: updateTime },
                { id: uuidv4(), code: 'SAVE20', type: 'fixed', value: 20, minOrderAmount: 100, startDate: new Date(), endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), createdById: admin.id, updatedAt: updateTime },
                { id: uuidv4(), code: 'FLASH50', type: 'percentage', value: 50, maxDiscount: 100, minOrderAmount: 200, usageLimit: 50, startDate: new Date(), endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), createdById: admin.id, updatedAt: updateTime }
            ]
        });

        console.log('\n✅ Seed data created successfully!\n');
        console.log('Test Accounts:');
        console.log('─────────────────────────────────────');
        console.log('Admin:       admin@ecommerce.com / admin123');
        console.log('Salesman:    salesman@ecommerce.com / salesman123');
        console.log('Deliveryman: delivery@ecommerce.com / delivery123');
        console.log('Customer:    customer@ecommerce.com / customer123');
        console.log('─────────────────────────────────────');
        console.log(`\nCoupons: WELCOME10 (10% off), SAVE20 ($20 off), FLASH50 (50% off)`);
        console.log(`Products: 8 products created`);
        console.log(`Categories: 5 main + 5 sub = 10 total\n`);

    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

seedData();
