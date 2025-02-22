// Required dependencies
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', // Update with your frontend URL
    credentials: true
}));

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/authDB'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/authDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User Schema
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

// Registration endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            fullName,
            email,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create session
        req.session.userId = user._id;
        res.json({ 
            message: 'Login successful',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// Protected route example
app.get('/api/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // Add your protected route logic here
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
