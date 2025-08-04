const Post = require('../models/Post');
const Story = require('../models/Story');
const User = require('../models/User');
const Reel = require('../models/Reel');
const Notification = require('../models/Notification');

exports.handelDashboard = async (req, res) => {

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
  _id: { $ne: req.session.userId },
  followers: { $ne: req.session.userId }
}).limit(5);
console.log(suggestedUsers);

    const safeStories = stories.filter(s => s.user);
// console.log(posts[0]?.comments[0]);

const reels = await Reel.find()
  .populate('user', 'username profilePic').populate('comments.user', 'username profilePic')
  .sort({ createdAt: -1 });

    res.render('dashboard', {
      title: 'Dashboard',
      user,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      posts,
      reels,
      stories: safeStories,
      unreadCount,
      notifications,
      suggestedUsers,
      loggedInUserId: req.session.userId,
      body: '<%- include("dashboardContent") %>'
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send('Dashboard load failed');
  }
}