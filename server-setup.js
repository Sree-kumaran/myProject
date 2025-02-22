// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);

module.exports = router;

// middleware/authMiddleware.js
const authMiddleware = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    next();
};

module.exports = authMiddleware;

// server.js
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Session configuration
app.use(session({
    secret: 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/userAuthDB'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
}));

// Routes
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
