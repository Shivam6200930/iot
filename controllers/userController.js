const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// 🛠️ Signup
exports.signup = async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, ledState: 'OFF' });

    await newUser.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(400).send('User already exists or invalid data');
  }
};

// 🔑 Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('User not found');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).send('Invalid password');

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

// 🚥 Get LED state by ID
exports.getLedState = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).send('User not found');

    res.json({ email: user.email, ledState: user.ledState });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

// 🔀 Toggle LED state by email
exports.toggleLed = async (req, res) => {
  const { ledState, email } = req.body;

  if (ledState !== 'ON' && ledState !== 'OFF') {
    return res.status(400).send('Invalid LED state');
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send('User not found');

    user.ledState = ledState;
    await user.save();

    res.send(`LED state for ${user.email} is now ${ledState}`);
  } catch (error) {
    console.error('Error updating LED state:', error);
    res.status(500).send('Server error');
  }
};
