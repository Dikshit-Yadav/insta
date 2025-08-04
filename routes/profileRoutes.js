const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Notification = require('../models/Notification');
const {isAuthenticated } =require('../middleware/authMiddleware');
// const upload = require('../middleware/upload');

const{handelProfile,handelProfileUsername,handelReel,handelEditProfile,handelsetting,handelUnSave,handelSave,handelFollow, handleDeleteAccount} = require('../controllers/profileController')
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// function isAuthenticated(req, res, next) {
//   if (req.session.userId) return next();
//   res.redirect('/login');
// }

const findUserByUsername = async (username) => {
  return await User.findOne({ username }).populate('followers').populate('following');
};

const findUserById = async (id) => {
  return await User.findById(id).populate('followers').populate('following');
};

router.get('/profile', isAuthenticated, handelProfile);
router.get('/profile/:username', isAuthenticated, handelProfileUsername);
router.get('/reels', isAuthenticated, handelReel)
router.get('/edit-profile', isAuthenticated, async (req, res) => {
  try {
    const user = await findUserById(req.session.userId);
    res.render('edit-profile', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
router.get('/settings', isAuthenticated, async (req, res) => {
  try {
    const user = await findUserById(req.session.userId);
    res.render('settings', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
router.get('/profile/:username/followers', isAuthenticated, async (req, res) => {
  try {
    const user = await findUserByUsername(req.params.username);
    res.render('followers', { user, followers: user.followers });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
router.get('/profile/:username/following', isAuthenticated, async (req, res) => {
  try {
    const user = await findUserByUsername(req.params.username);
    res.render('following', { user, following: user.following });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
router.get('/save/profile', (req, res) => {
  res.redirect('/profile');
});
router.get('/unsave/profile', (req, res) => {
  res.redirect('/profile');
});
router.get("/delete",isAuthenticated, handleDeleteAccount);

router.post('/edit-profile', isAuthenticated, handelEditProfile);
router.post('/settings', isAuthenticated, upload.single('profilePicFile'), handelsetting);
router.post('/follow/:id', isAuthenticated, handelFollow);
router.post('/save/:postId', handelSave);
router.post('/unsave/:postId', handelUnSave);


module.exports = router;
