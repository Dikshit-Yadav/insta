const express = require('express');
const multer = require('multer');
const path = require('path');
const Reel = require('../models/Reel');
const router = express.Router();
const User = require('../models/User');

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

router.post('/reels/:id/like', async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    const userId = req.session.userId;

    if (!reel) return res.status(404).send('Reel not found');

    const index = reel.likes.indexOf(userId);
    if (index === -1) {
      reel.likes.push(userId); 
    } else {
      reel.likes.splice(index, 1); 
    }

    await reel.save();
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error liking reel');
  }
});

router.post('/reels/:id/comment', async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    const userId = req.session.userId;

    if (!reel) return res.status(404).send('Reel not found');

    reel.comments.push({
      user: userId,
      content: req.body.comment
    });

    await reel.save();
    await reel.populate('comments.user', 'username profilePic');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error commenting on reel');
  }
});

module.exports = router;
