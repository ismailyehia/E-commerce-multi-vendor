const { prisma } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateTokens } = require('../utils/generateToken');

const formatUser = (user) => {
    if (!user) return null;
    const formatted = { ...user };
    delete formatted.password;
    delete formatted.refreshToken;

    // Map address -> addresses for frontend compatibility
    formatted._id = user.id;
    if (user.address) {
        formatted.addresses = user.address;
        delete formatted.address;
    } else if (!formatted.addresses) {
        formatted.addresses = [];
    }

    return formatted;
};

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Only allow customer registration publicly
        const allowedRole = (role === 'customer' || !role) ? 'customer' : 'customer';

        // Hash password before saving
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        let user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: allowedRole,
                updatedAt: new Date()
            }
        });

        const { accessToken, refreshToken } = generateTokens(user.id);

        user = await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken }
        });

        res.status(201).json({
            user: formatUser(user),
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'Account has been deactivated' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const { accessToken, refreshToken } = generateTokens(user.id);

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken }
        });

        res.json({
            user: formatUser(user),
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
const logout = async (req, res) => {
    try {
        if (req.user && req.user.id) {
            await prisma.user.update({
                where: { id: req.user.id },
                data: { refreshToken: null }
            });
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(401).json({ message: 'Refresh token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        let user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user || user.refreshToken !== token) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const tokens = generateTokens(user.id);
        user = await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken }
        });

        res.json(tokens);
    } catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                address: true,
                wishlist: {
                    select: { id: true, name: true, slug: true, images: true, price: true }
                }
            }
        });

        res.json(formatUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
    try {
        const { name, phone, addresses } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (addresses) {
            updateData.address = {
                deleteMany: {},
                create: addresses.map(addr => ({
                    label: addr.label,
                    fullName: addr.fullName,
                    phone: addr.phone,
                    street: addr.street,
                    city: addr.city,
                    state: addr.state,
                    zipCode: addr.zipCode,
                    country: addr.country || 'US',
                    isDefault: addr.isDefault || false
                }))
            };
        }

        if (req.file) {
            updateData.avatar = `/uploads/avatars/${req.file.filename}`;
        }

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            include: { address: true }
        });

        res.json(formatUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        let user = await prisma.user.findUnique({ where: { id: req.user.id } });

        if (!user || !user.password) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
const googleAuth = async (req, res) => {
    try {
        const { googleId, email, name, avatar } = req.body;

        let user = await prisma.user.findFirst({
            where: {
                OR: [{ googleId }, { email }]
            }
        });

        if (user) {
            if (!user.googleId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId }
                });
            }
        } else {
            user = await prisma.user.create({
                data: {
                    name,
                    email,
                    googleId,
                    avatar,
                    role: 'customer',
                    updatedAt: new Date()
                }
            });
        }

        const tokens = generateTokens(user.id);
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken }
        });

        res.json({
            user: formatUser(user),
            ...tokens
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Facebook OAuth login/register
// @route   POST /api/auth/facebook
const facebookAuth = async (req, res) => {
    try {
        const { facebookId, email, name, avatar } = req.body;

        let user = await prisma.user.findFirst({
            where: {
                OR: [{ facebookId }, { email }]
            }
        });

        if (user) {
            if (!user.facebookId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { facebookId }
                });
            }
        } else {
            user = await prisma.user.create({
                data: {
                    name,
                    email,
                    facebookId,
                    avatar,
                    role: 'customer',
                    updatedAt: new Date()
                }
            });
        }

        const tokens = generateTokens(user.id);
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken }
        });

        res.json({
            user: formatUser(user),
            ...tokens
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    register,
    login,
    logout,
    refreshToken,
    getMe,
    updateProfile,
    changePassword,
    googleAuth,
    facebookAuth
};
