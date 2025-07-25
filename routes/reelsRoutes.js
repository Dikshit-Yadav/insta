const express = require('express');
const multer = require('multer');
const path = require('path');
const Reel = require('../models/Reel');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reels');  
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + ext;
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

router.get('/reels/upload', (req, res) => {
  res.render('uploadReel');
});

router.post('/reels/upload', upload.single('video'), async (req, res) => {
  try {
    await Reel.create({
      user: req.session.userId,
      video: req.file.filename, 
      caption: req.body.caption  
    });
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading reel');
  }
});

module.exports = router;
