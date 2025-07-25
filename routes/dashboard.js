const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Story = require('../models/Story');
const User = require('../models/User');
const Notification = require('../models/Notification');

router.get('/dashboard', async (req, res) => {
  console.log("GET /dashboard route triggered");

  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findById(req.session.userId);

    const posts = await Post.find()
  .populate('userId', 'username profilePic')
  .populate({
    path: 'comments',
    populate: {
      path: 'user',
      select: 'username profilePic'
    }
  })
  .sort({ createdAt: -1 });

  // const posts = await Post.find()
  // .populate('userId', 'username profilePic')
  // .populate({
  //   path: 'comments',
  //   populate: {
  //     path: 'user',
  //     select: 'username profilePic'
  //   }
  // }).sort({ createdAt: -1 });

    const stories = await Story.find({ expiresAt: { $gt: new Date() } })
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 });

    const notifications = await Notification.find({ receiver: req.session.userId })
      .populate('sender', 'username profilePic')
      .sort({ createdAt: -1 })
      .limit(10);

    const unreadCount = await Notification.countDocuments({
      receiver: req.session.userId,
      isRead: false
    });

    const currentUser = await User.findById(req.session.userId).populate('following');
    const followingIds = currentUser.following.map(user => user._id);

    const suggestedUsers = await User.find({
      _id: { $nin: [...followingIds, req.session.userId] }
    }).limit(5);

    const safeStories = stories.filter(s => s.user);
console.log(posts[0]?.comments[0]);

    res.render('dashboard', {
      title: 'Dashboard',
      user,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      posts,
      stories: safeStories,
      unreadCount,
      notifications,
      suggestedUsers,
      body: '<%- include("dashboardContent") %>'
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send('Dashboard load failed');
  }
});

module.exports = router;
