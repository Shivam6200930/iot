const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  getLedState,
  toggleLed
} = require('../controllers/userController');

// Routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/led/:id', getLedState);
router.post('/led', toggleLed);

module.exports = router;
