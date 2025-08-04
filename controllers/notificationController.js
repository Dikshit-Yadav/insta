const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

exports.handelNotification = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  try {
    const notifications = await Notification.find({ receiver: req.session.userId })
      .populate('sender', 'username profilePic')
      .sort({ createdAt: -1 });

    res.render('notification', { notifications, title: "Notifications" });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).send('Server Error on notification');
  }
}