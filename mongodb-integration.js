// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb://localhost:27017/userAuthDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;

// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    accountStatus: {
        type: String,
        enum: ['active', 'pending', 'suspended'],
        default: 'active'
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

const User = mongoose.model('User', userSchema);
module.exports = User;

// controllers/userController.js
const User = require('../models/User');

const userController = {
    // Register new user
    register: async (req, res) => {
        try {
            const { fullName, email, password } = req.body;

            // Check if user already exists
            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Create new user
            const user = await User.create({
                fullName,
                email,
                password
            });

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                userId: user._id
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error in registration',
                error: error.message
            });
        }
    },

    // Login user
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check account status
            if (user.accountStatus !== 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Account is not active'
                });
            }

            // Verify password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                // Increment login attempts
                user.loginAttempts += 1;
                if (user.loginAttempts >= 5) {
                    user.accountStatus = 'suspended';
                }
                await user.save();

                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Update last login and reset login attempts
            user.lastLogin = new Date();
            user.loginAttempts = 0;
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error in login',
                error: error.message
            });
        }
    },

    // Get user profile
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.session.userId)
                .select('-password -loginAttempts');
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                user
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching profile',
                error: error.message
            });
        }
    },

    // Update user profile
    updateProfile: async (req, res) => {
        try {
            const updates = {
                fullName: req.body.fullName,
                email: req.body.email
            };

            const user = await User.findByIdAndUpdate(
                req.session.userId,
                updates,
                { new: true, runValidators: true }
            ).select('-password -loginAttempts');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                user
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating profile',
                error: error.message
            });
        }
    }
};

module.exports = userController;
