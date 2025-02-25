const express = require('express');
const path = require('path');
const session = require("express-session");
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { connectDB } = require("./src/config/atlas");
const mainrouter = require("./src/routes/mainrouter");

// Load environment variables
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration (only needed for development)
if (process.env.NODE_ENV !== 'production') {
    app.use(cors({
        origin: 'http://localhost:3001',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net']
        }
    }
}));
app.use(compression());

// Parse JSON bodies
app.use(express.json());

// Session configuration
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// API routes
app.use('/api', mainrouter);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message
    });
});

// Start server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
