const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const session = require('express-session');
const profileRoutes = require('./routes/profileRoutes');


app.use(session({
  secret: 'your-secret-key',  // Secret key to sign the session ID cookie
  resave: false,              // Don't save session if unmodified
  saveUninitialized: true,    // Save session even if uninitialized
  cookie: { secure: false }   // Set secure: true if using HTTPS (in production)
}));
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/', profileRoutes);
// MongoDB Connection
mongoose.connect('mongodb://localhost/instagram_clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/user'));
app.use('/posts', require('./routes/posts'));
app.use('/', require('./routes/postRoutes'));

// Home Route
app.get('/', async (req, res) => {
 
  res.render('login');
});

// Dashboard
app.get('/dashboard', async (req, res) => {
  // Ensure the user is logged in by checking the session
  if (!req.session.userId) { // Assuming you store userId in the session upon login
      return res.redirect('/auth/login'); // Redirect to login if no session data
  }

  try {
      const Post = require('./models/Post'); // Assuming your Post model is here
      const posts = await Post.find().sort({ createdAt: -1 }); // Fetch all posts, newest first

      // Fetch user data from the database based on the session userId
      const User = require('./models/User'); // Assuming your User model is here
      const user = await User.findById(req.session.userId);

      if (!user) {
          // Handle the case where the user ID in the session is invalid
          return res.redirect('/auth/login');
      }

      // Access user data from the fetched user object
      const { username, email } = user;

      res.render('dashboard', {
          username: username,
          email: email,
          posts: posts
      });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching data for dashboard');
  }
});



// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
