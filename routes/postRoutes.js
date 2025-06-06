const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');
const { isAuthenticated } = require('../middleware/authMiddleware'); // Middleware to check if user is authenticated

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Save the uploaded files in the 'public/uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Ensure unique filenames by appending timestamp
  }
});

const upload = multer({ storage });

// Route for uploading a post (only accessible to logged-in users)
// router.get('/posts/upload', isAuthenticated, (req, res) => {
//   res.render('upload'); // Render the post upload page
// });

// Route to render user's profile page with posts
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Find posts by the logged-in user
    const posts = await Post.find({ userId: userId }).sort({ createdAt: -1 }); // Sort by newest first

    // Render the profile page and pass the posts
    res.render('profile', { posts });
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to load profile.');
  }
});

// Route for uploading a post, with both authentication check and session-based userId passing
router.get('/posts/upload', isAuthenticated, (req, res) => {
  const userId = req.session.userId;
  res.render('upload', { userId }); // Ensure the session userId is passed to the view
});


// Handle post upload
router.post('/posts/upload', isAuthenticated, upload.single('postImage'), async (req, res) => {
  try {
    const { caption } = req.body; // Get caption from form
    const userId = req.session.userId; // Get userId from session (change from username)
    const postImage = req.file ? `/uploads/${req.file.filename}` : null; // Save image path

    if (!postImage) {
      return res.status(400).send('Image upload is required.');
    }

    if (!userId) {
      return res.status(400).send('You must be logged in to upload a post.');
    }

    // Create a new post object with the userId, caption, and image path
    const newPost = new Post({
      userId: userId,
      // user: userId,  // Ensure we save the userId
      caption: caption,
      postImage: postImage
    });

    // Save the new post to the database
    await newPost.save();
    await User.findByIdAndUpdate(
      userId,
      { $push: { posts: newPost._id } }, // <-- push post id into posts array
      { new: true }
    );
    res.redirect('/profile'); // Redirect to profile after successful upload
  }
   catch (error) {
    console.error(error);
    res.status(500).send('Failed to upload post.');
  }
});

// Like/Unlike a post
router.post('/posts/:id/like', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.session.userId;

    if (!post) return res.status(404).send('Post not found');

    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId); // like
    } else {
      post.likes.splice(index, 1); // unlike
    }

    await post.save();
    res.redirect('/profile'); // or use AJAX in frontend
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Add a comment
router.post('/posts/:id/comment', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    const comment = {
      user: req.session.userId,
      text: req.body.comment
    };

    post.comments.push(comment);
    await post.save();
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



module.exports = router;
