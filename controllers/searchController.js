const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const session = require('express-session');

exports.handelSearch = async (req, res) => {
  try {
      const query = req.query.q || '';
      console.log('Search query:', query);

      if (!query.trim()) {
          return res.render('search', { query: '', users: [], posts: [] });
      }

      const users = await User.find({
          username: { $regex: query, $options: 'i' }
      });

      const posts = await Post.find({
          caption: { $regex: new RegExp(query.trim(), 'i') }
      });

      console.log('Found posts:', posts.map(p => p.caption));

      res.render('search', { query, users, posts });
  } catch (err) {
      console.error(err);
      res.status(500).send('Search error');
  }
}

exports.handelshowUser = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid ObjectId:", userId);
      return res.status(400).send('Invalid user ID');
    }

    const user = await User.findById(userId)
      .populate('followers', 'username profilePic')
      .populate('following', 'username profilePic');

    if (!user) return res.status(404).send('User not found');

    const posts = await Post.find({ userId: user._id });
    // const reels = await Reel.find({ userId: user._id });
     const reels = await Reel.find({ user: user._id });

    console.log(reels);
    const currentUser = await User.findById(req.session.userId);
    const isOwnProfile = user._id.toString() === req.session.userId;

    res.render('show-user', { user, posts,reels, currentUser, isOwnProfile });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}