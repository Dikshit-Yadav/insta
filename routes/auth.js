const express = require('express');
const router = express.Router();
const User = require('../models/User');
// const session = require('express-session');

// app.use(session({
//   secret: 'your-secret-key',  // Secret key to sign the session ID cookie
//   resave: false,              // Don't save session if unmodified
//   saveUninitialized: true,    // Save session even if uninitialized
//   cookie: { secure: false }   // Set secure: true if using HTTPS (in production)
// }));
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
