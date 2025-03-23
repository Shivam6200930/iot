const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDb = require('./config/connectDb');
const userRoutes = require('./routers/userRoutes');

dotenv.config();
const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDb();

// Routes
app.use('/api/user', userRoutes);

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));
