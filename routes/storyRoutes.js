const express = require('express');
const router = express.Router();
const Story = require('../models/Story'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAuthenticated } = require('../middleware/authMiddleware');
const session = require('express-session');
const {handelUploadStory,handelShowStory}  =require('../controllers/storyController')
router.use(session({
  secret: 'your_secret_key',  
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  
}));

const uploadDir = path.join(__dirname, '../uploads/stories');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },  
}).single('storyImage');

router.get('/upload-story', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');  
  }
  res.render('upload-story');  
});

router.post('/upload-story', upload, handelUploadStory);


router.get('/story/:storyId', isAuthenticated, handelShowStory);




module.exports = router;
