const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const session = require('express-session');
const profileRoutes = require('./routes/profileRoutes');
const reelsRoutes = require('./routes/reelsRoutes');
const Story = require('./models/Story');
const storyRoutes = require('./routes/storyRoutes'); 
const searchRoutes = require('./routes/searchRoutes'); // Adjust path
app.use('/', searchRoutes); // or app.use('/search', searchRoutes);

app.use('/', storyRoutes);

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', profileRoutes);
app.use(reelsRoutes);
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
  if (!req.session.userId) { 
    return res.redirect('/auth/login');
  }

  try {
    const Post = require('./models/Post');
    const User = require('./models/User');
    const Story = require('./models/Story');

    const posts = await Post.find().sort({ createdAt: -1 });
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.redirect('/auth/login');
    }

    const stories = await Story.find({ expiresAt: { $gt: new Date() } }).populate('user');

    const { username, email, profilePic } = user;

    // Pass the body content in the render method
    res.render('dashboard', {
      title: 'Dashboard',
      username: username,
      email: email,
      profilePic: profilePic,
      posts: posts,
      stories: stories,
      body: '<%- include("dashboardContent") %>'  // Inject dashboard content
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
