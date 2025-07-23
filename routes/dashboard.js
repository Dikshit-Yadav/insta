const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Story = require('../models/Story');
const User = require('../models/User');

router.get('/dashboard', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  try {
    const user = await User.findById(req.session.userId);
    const posts = await Post.find().populate('userId','username profilePic').sort({ createdAt: -1 });

    const stories = await Story.find().populate('user').sort({ createdAt: -1 });
console.log("First Post User:", posts[0].userId);

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
    const safeStories = stories.filter(s => s.user) || null;

       console.log("🔍 Total Posts:", posts.postImage );
    res.render('dashboard', {
      user,
      posts,
      stories: safeStories,
      unreadCount,
      notifications,
      suggestedUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Dashboard load failed');
  }
});

const Notification = require('../models/Notification');

router.get('/notification', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  try {
    await Notification.updateMany(
      { recipient: req.session.userId, isRead: false },
      { $set: { isRead: true } }
    );

    const notifications = await Notification.find({ recipient: req.session.userId })
      .populate('sender')
      .sort({ createdAt: -1 });

    res.render('notification', { notifications });
  } catch (err) {
    console.error(err);
    res.status(500).send("Could not load notifications");
  }
});





module.exports = router;
