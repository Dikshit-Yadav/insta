const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Story = require('../models/Story');
const { isAuthenticated } = require('../middleware/authMiddleware');

const { handelFeed } = require('../controllers/feedController');

router.get('/feed', isAuthenticated, handelFeed);


module.exports = router;
