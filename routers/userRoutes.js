const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  getLedState,
  toggleLed,
  getUser,
  googleLogin,
  sendOtp,
  verifyOtp,
  chatbotHandler
  
} = require('../controllers/userController');

// Routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/led/:id', getLedState);
router.post('/led', toggleLed);
router.get('/getUser/:userId',getUser)
router.post('/google-login', googleLogin);
router.post('/send-otp',sendOtp)
router.post('/verify-otp',verifyOtp)
router.post('/chatbot',chatbotHandler)



module.exports = router;
