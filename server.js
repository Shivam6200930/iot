const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDb = require('./config/connectDb');
const userRoutes = require('./routers/userRoutes');
const deviceRoutes = require('./routers/devicesRoutes');

dotenv.config();
const app = express();
const port = process.env.PORT || 5001;

// ✅ Configure CORS with proper settings
app.use(cors({
  origin: '*',  // Allow requests from any origin (for testing)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization']  // Allowed headers
}));

// Middleware
app.use(express.json());

// Database connection
connectDb();

// Routes
app.use('/api/user', userRoutes);
app.use('/api/devices', deviceRoutes);  // ✅ Correct route for devices

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));
