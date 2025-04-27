const express = require('express');
const multer = require('multer');
const path = require('path');
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
// Route for uploading a post, with both authentication check and session-based userId passing
router.get('/posts/upload', isAuthenticated, (req, res) => {
  const userId = req.session.userId;
  res.render('upload', { userId }); // Ensure the session userId is passed to the view
});


// Handle post upload
router.post('/posts/upload', isAuthenticated, upload.single('postImage'), async (req, res) => {
  try {
    const { caption } = req.body; // Get caption from form
    const username = req.session.username; // Get username from session
    const postImage = req.file ? `/uploads/${req.file.filename}` : null; // Save image path

    if (!postImage) {
      return res.status(400).send('Image upload is required.');
    }

    if (!username) {
      return res.status(400).send('You must be logged in to upload a post.');
    }

    // Create a new post object with the username, caption, and image path
    const newPost = new Post({
      username: username,
      caption: caption,
      postImage: postImage
    });

    // Save the new post to the database
    await newPost.save();
    res.redirect('/dashboard'); // Redirect to dashboard after successful upload
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to upload post.');
  }
});

module.exports = router;
