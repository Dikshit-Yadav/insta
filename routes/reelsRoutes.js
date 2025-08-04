const express = require('express');
const multer = require('multer');
const path = require('path');
const Reel = require('../models/Reel');
const router = express.Router();
const User = require('../models/User');
const upload = require('../middleware/upload');
const {reelUpload,reelComment,reelLike} = require('../controllers/reelController');
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/reels');  
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const filename = Date.now() + ext;
//     cb(null, filename);
//   }
// });

// const upload = multer({ storage: storage });
  

router.get('/reels/upload', (req, res) => {
  res.render('uploadReel');
});

router.post('/reels/upload', upload.single('video'), reelUpload);

router.post('/reels/:id/like', reelLike);

router.post('/reels/:id/comment', reelComment);

module.exports = router;
