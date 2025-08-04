const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Story = require('../models/Story');
const User = require('../models/User');
const Reel = require('../models/Reel');
const Notification = require('../models/Notification');

const { handelDashboard } = require('../controllers/dashboardController');

router.get('/dashboard', handelDashboard);

module.exports = router;
