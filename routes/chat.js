const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const {handelPost} = require("../controllers/chatController")

router.post('/start', handelPost);

router.get('/:userId', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  try {
    const senderId = req.session.userId;
    const receiverId = req.params.userId;

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver) return res.status(404).send('User not found');

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    }).sort({ createdAt: 1 });

    res.render('chat', {
      user: sender,
      receiver,
      messages
    });
  } catch (err) {
    console.error('Error loading chat:', err);
    res.status(500).send('Something went wrong');
  }
});

router.get('/messages/:userId', async (req, res) => {
  const senderId = req.session.userId;
  const receiverId = req.params.userId;
  const skip = parseInt(req.query.skip) || 0;
  const limit = 20;

  try {
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages.reverse()); 
  } catch (err) {
    console.error("Pagination error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});


module.exports = router;
