const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const session = require('express-session');
const { followUser } = require('../controllers/followUserController');
const { handelSearch, handelshowUser} = require('../controllers/searchController');
const { isAuthenticated} = require('../middleware/authMiddleware');

router.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));


router.post('/follow/:id', isAuthenticated, followUser);
router.get('/search', handelSearch);
router.get('/show-user/:userId', isAuthenticated, handelshowUser);
router.get('/post/:id', async (req, res) => {
  const post = await Post.findById(req.params.id).populate('userId', 'username profilePic');
  res.render('post-model', { post });
});

router.get('/reel/:id', async (req, res) => {
  const reel = await Reel.findById(req.params.id)
  .populate('user', 'username profilePic')  
  .select('video caption user'); 
  res.render('reel-model', { reel });
});



module.exports = router;
