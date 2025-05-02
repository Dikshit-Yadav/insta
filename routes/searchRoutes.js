const express = require('express');
const router = express.Router();
// const followUser = require('../controllers/followUser');
const User = require('../models/User'); // Adjust path
const Post = require('../models/Post'); // If searching posts too
const session = require('express-session');
const { followUser } = require('./controllers/followUser');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.use(session({
  secret: 'your-secret-key',  // Secret key to sign the session ID cookie
  resave: false,              // Don't save session if unmodified
  saveUninitialized: true,    // Save session even if uninitialized
  cookie: { secure: false }   // Set secure: true if using HTTPS (in production)
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


// Route to show user profile

router.get('/show-user/:userId', isAuthenticated, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const userId = req.params.userId;

    // Validate ObjectId
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


// router.get('/show-user/:userId', isAuthenticated, async (req, res) => {
//     try {
//         const user = await User.findById(req.params.userId); 
//         // const user = await User.findById(req.params.id);// Use userId from URL
//         if (!user) return res.status(404).send('User not found');
//         console.log("User ID:", user._id);

//         const posts = await Post.find({ user: user._id });
        

//         res.render('show-user', { user, posts,currentUser: req.user  });  // Render the show-user.ejs template
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Server error');
//     }
// });

module.exports = router;
