const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const {handelchatList} = require('../controllers/chatListController')

router.get('/chat',handelchatList);

module.exports = router;
