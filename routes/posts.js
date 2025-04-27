const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Get All Posts (for API)
router.get('/', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

module.exports = router;
