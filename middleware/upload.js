const multer = require('multer');
const path = require('path');

// Set up Multer storage (upload to 'public/uploads/')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/'); // Save uploaded images in this folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Give a unique name to the file
  }
});

const upload = multer({ storage });

module.exports = upload;
