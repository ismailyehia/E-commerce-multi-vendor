const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { storage } = require('../config/cloudinary');

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
    storage: storage('products'),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).array('images', 10);

const uploadAvatar = multer({
    storage: storage('avatars'),
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
}).single('avatar');

const uploadAdMedia = multer({
    storage: storage('ads'),
    fileFilter: videoFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB for videos
}).single('media');

const uploadReviewImages = multer({
    storage: storage('reviews'),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).array('images', 5);

const uploadDeliveryProof = multer({
    storage: storage('deliveries'),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('proof');

const uploadCategoryImage = multer({
    storage: storage('categories'),
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
