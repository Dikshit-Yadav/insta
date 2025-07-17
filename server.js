const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const session = require('express-session');
const profileRoutes = require('./routes/profileRoutes');
const reelsRoutes = require('./routes/reelsRoutes');
const Story = require('./models/Story');
const User = require('./models/User');
const storyRoutes = require('./routes/storyRoutes'); 
const searchRoutes = require('./routes/searchRoutes');
const nodemailer = require('nodemailer');
const authRoutes = require('./routes/auth');

app.use('/', searchRoutes); 

app.use('/', storyRoutes);

app.use(session({
  secret: 'your-secret-key',  
  resave: false,              
  saveUninitialized: true,    
  cookie: { secure: false } 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', profileRoutes);
app.use(reelsRoutes);

mongoose.connect('mongodb://localhost/instagram_clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/auth', authRoutes);

app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/user'));
app.use('/posts', require('./routes/posts'));
app.use('/', require('./routes/postRoutes'));
app.use('/logout', require('./routes/auth'));
app.use('/forget', require('./routes/auth'));

app.get('/', async (req, res) => {
 
  res.render('login');
});

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

    res.render('dashboard', {
      title: 'Dashboard',
      username: username,
      email: email,
      profilePic: profilePic,
      posts: posts,
      stories: stories,
      body: '<%- include("dashboardContent") %>'  
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data for dashboard');
  }
});

app.get("/forgot-password",(req,res)=>{
  res.render("forget");
})
app.post("/forgot-password", async (req, res) => {
  let { email } = req.body;

  try {
    let getEmail = await User.findOne({ email });

    if (!getEmail) {
      return res.status(404).send("User not found");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "2004dikshityadav@gmail.com",
        pass: "svoe eqar fbnk kmek",
      },
    });

    const mailOptions = {
      from: "2004dikshityadav@gmail.com",
      to: email,
      subject: "Your Password",
      text: `Your password is: ${getEmail.password}`,
    };
    await transporter.sendMail(mailOptions);

    res.redirect("/");
  } catch (err) {
    console.error("Error in forgot-password route:", err);
    res.status(500).send("Internal server error");
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});