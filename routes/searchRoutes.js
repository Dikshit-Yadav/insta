const express = require('express');
const router = express.Router();
// const followUser = require('../controllers/followUser');
const User = require('../models/User'); 
const Post = require('../models/Post'); 
const session = require('express-session');
const { followUser } = require('./controllers/followUser');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.use(session({
  secret: 'your-secret-key',  
  resave: false,              
  saveUninitialized: true,    
  cookie: { secure: false }   
}));

router.post('/follow/:id', isAuthenticated, followUser);

router.get('/search', async (req, res) => {
  try {
      const query = req.query.q || '';
      console.log('Search query:', query);

      if (!query.trim()) {
          return res.render('search', { query: '', users: [], posts: [] });
      }

      const users = await User.find({
          username: { $regex: query, $options: 'i' }
      });

      const posts = await Post.find({
          caption: { $regex: new RegExp(query.trim(), 'i') }
      });

      console.log('Found posts:', posts.map(p => p.caption));

      res.render('search', { query, users, posts });
  } catch (err) {
      console.error(err);
      res.status(500).send('Search error');
  }
});



router.get('/show-user/:userId', isAuthenticated, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid ObjectId:", userId);
      return res.status(400).send('Invalid user ID');
    }

    const user = await User.findById(userId)
      .populate('followers', 'username profilePic')
      .populate('following', 'username profilePic');

    if (!user) return res.status(404).send('User not found');

    const posts = await Post.find({ user: user._id });

    const currentUser = await User.findById(req.session.userId);
    const isOwnProfile = user._id.toString() === req.session.userId;

    res.render('show-user', { user, posts, currentUser, isOwnProfile });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



module.exports = router;
