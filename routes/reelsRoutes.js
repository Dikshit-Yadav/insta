const express = require('express');
const multer = require('multer');
const path = require('path');
const Reel = require('../models/Reel');
const router = express.Router();

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reels');  // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + ext; // Ensures unique filenames
    cb(null, filename);
  }
});

// Define the upload middleware
const upload = multer({ storage: storage });

// Show Reel Upload Page
router.get('/reels/upload', (req, res) => {
  res.render('uploadReel');
});

// Upload Reel
router.post('/reels/upload', upload.single('video'), async (req, res) => {
  try {
    await Reel.create({
      user: req.session.userId,
      video: req.file.filename,  // Store the video filename
      caption: req.body.caption  // Store the caption provided by the user
    });
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading reel');
  }
});

module.exports = router;
