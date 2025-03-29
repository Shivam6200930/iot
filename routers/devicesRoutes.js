const express = require('express');
const router = express.Router();
const {
    addDevice,
    deleteDevice,
    updateDevice,
    getDevices,
    updateState
} = require('../controllers/userController');

// ✅ Correct and consistent routes
router.post('/add/:userId', addDevice);
router.delete('/delete/:userId/:deviceId', deleteDevice);
router.put('/update/:userId/:deviceId', updateDevice);
router.get('/:id/devices',getDevices)
router.put('/:userId/devices/:deviceId',updateState)

module.exports = router;
