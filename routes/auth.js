const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Story = require('../models/Story');
const Post = require('../models/Post');
const upload = require('../middleware/upload');
const transporter = require("../routes/utility/transport");
const { handelRegister, handelUploadProfilePic, handelLogin,handelVerify } = require('../controllers/authController')
let otpObj = {};

router.get('/register', (req, res) => {
  res.render('register', { title: 'Sign Up' });
});
router.get('/login', (req, res) => {
  res.render('login', { title: 'Log In' });
});
router.get("/verify", (req, res) => {
  res.render("Verify");
});


router.post('/register', handelRegister);
router.post('/upload-profile-pic', upload.single('profilePicFile'), handelUploadProfilePic);
router.post('/login', handelLogin);
router.post('/verify', handelVerify);

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/auth/login');
  });
});


module.exports = router;
