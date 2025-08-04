const express = require('express');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const Story = require('../models/Story');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const { handelPostUpload, handelPostLike, handelPostComment, handelPostFeed, handelFollow } = require('../controllers/postController');


router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const posts = await Post.find({ userId }).sort({ createdAt: -1 });
    res.render('profile', { posts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load profile.');
  }
});
router.get('/posts/upload', isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('upload', { user });
});



router.post('/posts/upload', isAuthenticated, upload.single('postImage'), handelPostUpload);
router.post('/posts/:id/like', isAuthenticated, handelPostLike);
router.post('/posts/:id/comment', isAuthenticated, handelPostComment);
router.get('/feed', isAuthenticated, handelPostFeed);
router.post('/follow/:id', isAuthenticated, handelFollow);

module.exports = router;
