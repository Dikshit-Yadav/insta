const express = require('express');
const router = express.Router();
const Story = require('../models/Story');  // Ensure correct path
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAuthenticated } = require('../middleware/authMiddleware');
const session = require('express-session');

// Use express-session middleware to manage sessions
router.use(session({
  secret: 'your_secret_key',  
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  
}));

// Ensure uploads/stories directory exists
const uploadDir = path.join(__dirname, '../uploads/stories');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Store file in the 'uploads/stories' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Store file with timestamp
  },
});

// Initialize multer with file size limit and storage configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB file size limit
}).single('storyImage');

// Route for uploading story (GET request to show upload page)
router.get('/upload-story', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');  // Redirect to login if user is not logged in
  }
  res.render('upload-story');  // Render the story upload page
});

router.post('/upload-story', upload, async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).send('You need to be logged in to upload a story');
    }

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).send('No file uploaded');
    }

    console.log('File uploaded:', req.file);  // Log file details

    const newStory = new Story({
      user: req.session.userId,  // Assuming userId is stored in session
      media: `/uploads/stories/${req.file.filename}`,  // Serve file from static path
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),  // Expires in 24 hours
    });
    
    await newStory.save();
    console.log('Story uploaded successfully');
    res.redirect('/dashboard');  // Redirect back to dashboard
  } catch (err) {
    console.error('Error during story upload:', err);
    res.status(500).send('Error uploading story');
  }
});

// Route for handling the uploaded story (GET request to view story)
router.get('/story/:storyId', isAuthenticated, async (req, res) => {
  try {
    const currentStory = await Story.findById(req.params.storyId)
      .populate('user')
      .exec();

    if (!currentStory) return res.status(404).send('Story not found');

    // Track view
    if (!currentStory.views.includes(req.session.userId)) {
      currentStory.views.push(req.session.userId);
      await currentStory.save();
    }

    // Fetch next and previous stories
    const nextStory = await Story.findOne({ createdAt: { $gt: currentStory.createdAt } })
      .sort({ createdAt: 1 }).populate('user');

    const prevStory = await Story.findOne({ createdAt: { $lt: currentStory.createdAt } })
      .sort({ createdAt: -1 }).populate('user');

    res.render('storyViewer', {
      story: currentStory,
      nextStory,
      prevStory
    });
    console.log('Views:', currentStory.views);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
  

});



module.exports = router;
