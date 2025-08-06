const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const Story = require('../models/Story');
const router = express.Router();


exports.handelPostUpload = async (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.session.userId;
    const postImage = req.file ? `/uploads/${req.file.filename}` : null;

    if (!postImage) return res.status(400).send('Image upload is required.');

    const newPost = new Post({ userId, caption, postImage });
    await newPost.save();

    await User.findByIdAndUpdate(userId, { $push: { posts: newPost._id } }, { new: true });

    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to upload post.');
  }
}

exports.handelPostLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('userId');
    const userId = req.session.userId;

    if (!post) return res.status(404).send('Post not found');

    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId);

      if (post.userId._id.toString() !== userId) {
        await Notification.create({
          receiver: post.userId._id,
          sender: userId,
          type: 'like',
          message: 'liked your post'
        });
      }
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
   
     res.redirect(req.get('Referrer') || '/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error on like');
  }
}

exports.handelPostComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('userId');
    const userId = req.session.userId;

    if (!post) return res.status(404).send('Post not found');

    const newComment = new Comment({
      postId: post._id,
      user: userId,
      content: req.body.comment
    });
    await newComment.save();

    post.comments.push(newComment._id);
    await post.save();

    if (post.userId._id.toString() !== userId) {
      await Notification.create({
        receiver: post.userId._id,
        sender: userId,
        type: 'comment',
        message: 'commented on your post'
      });
    }

   res.redirect(req.get('Referrer') || '/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to comment on post');
  }
}

exports.handelPostFeed = async (req, res) => {
  try {
    const userId = req.session.userId;
    const currentUser = await User.findById(userId).populate('following');

    const followingIds = currentUser.following.map(u => u._id);
    const excludeIds = [...followingIds, currentUser._id];

    const feedPosts = await Post.find({ userId: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .populate('userId', 'username profilePic');

    const suggestedPosts = await Post.find({ userId: { $nin: excludeIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'username profilePic');

    const stories = await Story.find()
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 });

    res.render('feed', {
      posts: feedPosts,
      suggestedPosts,
      user: currentUser,
      stories
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading feed');
  }
}

exports.handelFollow = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.session.userId);

    if (!targetUser || !currentUser) return res.status(404).send('User not found');
    if (targetUser._id.equals(currentUser._id)) return res.status(400).send('Cannot follow yourself');

    if (!currentUser.following.includes(targetUser._id)) {
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);

      await currentUser.save();
      await targetUser.save();

      await Notification.create({
        sender: currentUser._id,
        recipient: targetUser._id,
        type: 'follow',
        message: `${currentUser.username} started following you.`
      });

      console.log(`Notification created for ${targetUser.username}`);
    }

    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error following user');
  }
}