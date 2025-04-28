const express = require('express');
const router = express.Router();
const User = require('../models/User');
const upload = require('../middleware/upload');

router.get('/register', (req, res) => {
  res.render('register', { title: 'Sign Up' });
});
// Register
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
// Login
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   console.log({ email, password });

//   try {
//     // Find the user by email
//     const user = await User.findOne({ email });

//     // Check if the user exists
//     if (!user) {
//       return res.status(400).send('Invalid credentials');
//     }

//     // Debugging password comparison
//     console.log('Stored Password:', user.password);
//     console.log('Entered Password:', password);

//     // Compare passwords directly
//     if (user.password === password) {
//       // req.session.userId = user._id;
//       return res.redirect('/dashboard');
//     } else {
//       return res.status(400).send('Invalid credentials');
//     }

//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Login failed');
//   }
// });
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log({ email, password });

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(400).send('Invalid credentials');
    }

    // Compare entered password with the stored password directly (not recommended for production)
    if (user.password === password) {
      // Store user details in the session
      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.email = user.email;

      // Redirect to dashboard after successful login
      return res.redirect('/dashboard');
    } else {
      return res.status(400).send('Invalid credentials');
    }

  } catch (err) {
    console.error(err);
    res.status(500).send('Login failed');
  }
});

// router.post('/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send('No file uploaded.');
//     }

//     // Update user's profilePic in the database
//     const updatedUser = await User.findByIdAndUpdate(req.session.userId, {
//       profilePic: req.file.filename  // Save the new profile pic filename
//     }, { new: true });

//     // Redirect to profile page after updating
//     res.redirect(`/profile/${updatedUser._id}`);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error uploading profile picture.');
//   }
// });

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login'); // Redirect to login after logging out
  });
});


module.exports = router;
