const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');

exports.handelPost = async (req, res) => {
  const senderId = req.session.userId;
  const { receiverId, content } = req.body;

  if (!senderId || !receiverId || !content.trim()) {
    return res.status(400).send("Missing data");
  }

  try {
    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: content.trim()
    });

    res.redirect(`/chat/${receiverId}`);
  } catch (err) {
    console.error("Failed to start chat:", err);
    res.status(500).send("Failed to send message");
  }
}