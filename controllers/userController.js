const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const twilio = require('twilio');
const dotenv = require('dotenv');
dotenv.config();


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;  // Add Service SID
const clientTwilio = twilio(accountSid, authToken);


// 🛠️ Signup
exports.signup = async (req, res) => {
  const { firstName,lastName,email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({firstName, email,lastName, password: hashedPassword, ledState: 'OFF' });

    await newUser.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(400).send('User already exists or invalid data');
  }
};

exports.googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, sub, picture } = ticket.getPayload();
    const [firstName, lastName] = name ? name.split(' ') : ['Google', 'User'];

    let user = await User.findOne({ email });

    if (!user) {
      // ✅ Create new Google user with minimal fields
      user = new User({
        email,
        googleId: sub,
        firstName: firstName || 'Google',
        lastName: lastName || 'User',
        password: '',   // No password for Google users
        phone: Math.floor(1000000000 + Math.random() * 9000000000),      // No phone initially
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token: jwtToken, user });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).send('Google login failed');
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
exports.getUser = async(req,res)=>{
  const { userId } = req.params;
  try {


    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ devices: user.devices });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}

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

exports.addDevice = async(req,res)=>{
  const { userId } = req.params;
  const { name, type, state } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Add new device to the array
    const newDevice = { name, type, state };

    // Use $push to add to devices array without full validation
    await User.findByIdAndUpdate(userId, { $push: { devices: newDevice } });

    const updatedUser = await User.findById(userId);
    res.status(201).json({ message: 'Device added successfully', devices: updatedUser.devices });
    
  } catch (error) {
    console.error('Error adding device:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}

exports.deleteDevice = async(req,res)=>{
  const { userId, deviceId } = req.params;

  if (!userId || !deviceId) {
    return res.status(400).json({ message: 'User ID and Device ID are required' });
  }

  try {
    // ✅ Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Find the index of the device to delete
    const deviceIndex = user.devices.findIndex(device => device._id.toString() === deviceId);

    if (deviceIndex === -1) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // ✅ Remove the device from the array
    user.devices.splice(deviceIndex, 1);

    // ✅ Save the user with validation disabled for modified fields only
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({ message: 'Device deleted successfully', devices: user.devices });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

exports.updateDevice = async(req,res)=>{
  const { userId, deviceId } = req.params;
  const { name, type, state } = req.body;

  try {
    if (!userId || !deviceId) {
      return res.status(400).json({ message: 'User ID or Device ID is missing' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Use $set to update only the device field
    await User.updateOne(
      { _id: userId, 'devices._id': deviceId },
      {
        $set: {
          'devices.$.name': name,
          'devices.$.type': type,
          'devices.$.state': state
        }
      }
    );

    // ✅ Return updated devices
    const updatedUser = await User.findById(userId);
    res.status(200).json({
      message: 'Device updated successfully',
      devices: updatedUser.devices
    });

  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}

exports.sendOtp = async (req, res) => {
  const { phone } = req.body;

  try {
    const otpResponse = await clientTwilio.verify.v2
    .services(serviceSid)
    .verifications
    .create({ to: `+91${phone}`, channel: 'sms' });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      sid: otpResponse.sid,
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

// ✅ Verify OTP Function
exports.verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const verificationCheck = await clientTwilio.verify.v2
      .services(serviceSid)
      .verificationChecks
      .create({ to: `+91${phone}`, code: otp });

    if (verificationCheck.status === 'approved') {
      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message,
    });
  }
};

exports.getDevices = async(req,res)=>{
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user.devices);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

exports.updateState = async(req,res)=>{
  const { userId, deviceId } = req.params;
  const { state } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find the device by ID and update its state
    const device = user.devices.id(deviceId);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    device.state = state;
    await user.save();

    res.status(200).json({ message: 'Device state updated', device });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

