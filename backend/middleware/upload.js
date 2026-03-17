const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Storage config for product images
const productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/products');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `product-${uuidv4()}${ext}`);
    }
});

// Storage config for avatars
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${uuidv4()}${ext}`);
    }
});

// Storage config for ads
const adStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/ads');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `ad-${uuidv4()}${ext}`);
    }
});

// Storage config for reviews
const reviewStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/reviews');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `review-${uuidv4()}${ext}`);
    }
});

// Storage config for delivery proofs
const deliveryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/deliveries');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `delivery-${uuidv4()}${ext}`);
    }
});

// Storage config for categories
const categoryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/categories');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `category-${uuidv4()}${ext}`);
    }
});

// File filter
const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const videoFilter = (req, file, cb) => {
    const allowedTypes = /mp4|webm|ogg|avi/;
    const imageTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase()) ||
        imageTypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
        cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed!'), false);
    }
};

// Upload middlewares
const uploadProductImages = multer({
    storage: productStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).array('images', 10);

const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
}).single('avatar');

const uploadAdMedia = multer({
    storage: adStorage,
    fileFilter: videoFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB for videos
}).single('media');

const uploadReviewImages = multer({
    storage: reviewStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).array('images', 5);

const uploadDeliveryProof = multer({
    storage: deliveryStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('proof');

const uploadCategoryImage = multer({
    storage: categoryStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('image');

module.exports = {
    uploadProductImages,
    uploadAvatar,
    uploadAdMedia,
    uploadReviewImages,
    uploadDeliveryProof,
    uploadCategoryImage
};
