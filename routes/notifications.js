const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

const { handelNotification } = require('../controllers/notificationController');

router.get('/notifications', handelNotification);

module.exports = router;
