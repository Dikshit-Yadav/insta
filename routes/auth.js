const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Story = require('../models/Story');
const Post = require('../models/Post');
const upload = require('../middleware/upload');

router.get('/register', (req, res) => {
  res.render('register', { title: 'Sign Up' });
});
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
      await User.create({ username, email, password });
      res.redirect('/');
  } catch (err) {
      console.error(err);
      if (err.code === 11000 && err.keyPattern && err.keyPattern.username) {
          return res.status(400).send('Username already exists.');
      } else if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
          return res.status(400).send('Email already exists.');
      }
      res.status(400).send('Error registering user');
  }
});
router.get('/login', (req, res) => {
  res.render('login', { title: 'Log In' });
});

router.post('/upload-profile-pic', upload.single('profilePicFile'), async (req, res) => {
  try {
    const userId = req.session.userId;
    let newProfilePic;

    if (req.file) {
      // If user uploaded a file
      newProfilePic = req.file.filename;  // Save the filename
    } else if (req.body.profilePicUrl) {
      // If user pasted a URL
      newProfilePic = req.body.profilePicUrl;  // Save the URL
    } else {
      return res.status(400).send('No profile picture provided.');
    }

    await User.findByIdAndUpdate(userId, { profilePic: newProfilePic });

    res.redirect(`/profile/${userId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile picture.');
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log({ email, password });

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send('Invalid credentials');
    }

    if (user.password === password) {
      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.email = user.email;

     

      return res.redirect('/dashboard');
    } else {
      return res.status(400).send('Invalid credentials');
    }

  } catch (err) {
    console.error(err);
    res.status(500).send('Login failed');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');
  });
});


module.exports = router;
