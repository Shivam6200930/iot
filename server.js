const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// MongoDB connection
async function connectDb() {
  try {
    await mongoose.connect(DATABASE_URL, { dbName: 'iot-all' });
    console.log('Database Connected...');
  } catch (error) {
    console.error('DB Connection Error:', error);
  }
}

connectDb();

// ✅ User Schema with LED State
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  ledState: { type: String, default: 'OFF' },  // LED state for each user
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 🔐 Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).send('Access Denied');

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid Token');
    req.user = user;
    next();
  });
};

// 🚀 Signup API
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, ledState: 'OFF' });

    await newUser.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(400).send('User already exists or invalid data');
  }
});

// 🚀 Login API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).send('User not found');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).send('Invalid password');

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token,user });
});

// 🚀 Get LED State for Logged-in User
app.get('/api/user/led/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).send('User not found');

    res.json({ email: user.email, ledState: user.ledState });
  } catch (error) {
    res.status(500).send('Server error');
  }
});


// 🚀 Toggle LED State for Logged-in User
app.post('/api/user/led', async (req, res) => {
  const { ledState, email } = req.body;

  // Validate LED state
  if (ledState !== 'ON' && ledState !== 'OFF') {
    return res.status(400).send('Invalid LED state');
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Update the user's LED state
    user.ledState = ledState;
    await user.save();

    res.send(`LED state for ${user.email} is now ${ledState}`);
  } catch (error) {
    console.error('Error updating LED state:', error);
    res.status(500).send('Server error');
  }
});


// Start the server
const port = 5001;
app.listen(port, () => {
  console.log(`listening port on ${port}`);
});

