const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

const findUserByUsername = async (username) => {
  return await User.findOne({ username }).populate('followers').populate('following');
};

exports.handelProfileUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await findUserByUsername(username);

    if (!user) return res.status(404).send('User not found');

    const posts = await Post.find({ userId: user._id })
      .populate('userId', 'username profilePic')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profilePic'
        }
      })
      .sort({ createdAt: -1 });
    const savedPosts = await Post.find({
      _id: { $in: user.savedPosts }
    }).sort({ createdAt: -1 });

    const reels = await Reel.find({ user: user._id }).sort({ createdAt: -1 });

    res.render('profile', {
      user,
      posts,
      savedPosts,
      reels,
      isOwnProfile: req.session.username === username,
      loggedInUserId: req.session.userId,
      isFollowing: user.followers.some(follower => follower._id.toString() === req.session.userId)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error on load profile');
  }
}
exports.handelProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).send('User not found');
    res.redirect(`/profile/${user.username}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}
exports.handelReel = async (req, res) => {
  try {
    req.render("uploadReel.ejs");
  } catch {
    console.error(err);
    res.status(500).send('Server error on load reels');
  }
}
exports.handelEditProfile = async (req, res) => {
  try {
    const { bio } = req.body;
    await User.findByIdAndUpdate(req.session.userId, { bio });
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile');
  }
}
exports.handelsetting = async (req, res) => {
  try {
    const { username, email, bio, password } = req.body;
    const user = await User.findById(req.session.userId);

    if (!user) return res.status(404).send('User not found');

    if (req.file) user.profilePic = req.file.filename;
    if (username) user.username = username;
    if (email) user.email = email;
    if (bio) user.bio = bio;
    if (password) user.password = password;

    await user.save();
    res.redirect(`/profile/${user.username}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating settings');
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
        receiver: targetUser._id,
        type: 'follow',
        message: `${currentUser.username} started following you.`,
      });
      console.log(`Notification created for ${targetUser.username} from ${currentUser.username}`);
    }

    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error following user');
  }
}
exports.handelSave = async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user.savedPosts.includes(req.params.postId)) {
    user.savedPosts.push(req.params.postId);
    await user.save();
  }
  res.redirect('profile');
}
exports.handelUnSave = async (req, res) => {
  const user = await User.findById(req.session.userId);
  user.savedPosts.pull(req.params.postId);
  await user.save();
  res.redirect('profile');
}


// exports.handleDeleteAccount = async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     if (!userId) return res.status(401).json({ message: "Not authorized" });
//     await Post.deleteMany({ userId: userId });
//     await Reel.deleteMany({ user: userId });
//     await Post.updateMany({}, { $pull: { likes: userId } });
//     await Reel.updateMany({}, { $pull: { likes: userId, views: userId } });
//     await Post.updateMany({}, { $pull: { comments: { user: userId } } });
//     await Reel.updateMany({}, { $pull: { comments: { user: userId } } });
//     await User.updateMany({}, { 
//       $pull: { 
//         followers: userId,
//         following: userId
//       } 
//     });
//     await Notification.deleteMany({ 
//       $or: [
//         { user: userId },
//         { from: userId },
//         { to: userId }
//       ]
//     });
//     await User.findByIdAndDelete(userId);
//     req.session.destroy();
//     res.redirect("/auth/register");

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error deleting account" });
//   }
// };





exports.handleDeleteAccount = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authorized" });

    const posts = await Post.find({ userId });
    const postIds = posts.map(post => post._id);
    await Comment.deleteMany({ postId: { $in: postIds } });
    await Post.deleteMany({ userId });

    await Reel.deleteMany({ user: userId });

    await Reel.updateMany({}, {
      $pull: {
        likes: userId,
        views: userId,
        comments: { user: userId }
      }
    });

    await Post.updateMany({}, {
      $pull: {
        likes: userId,
        comments: userId 
      }
    });

    await Comment.deleteMany({ user: userId });

    await User.updateMany({}, {
      $pull: {
        followers: userId,
        following: userId
      }
    });

    await Notification.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }]
    });

    await Message.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }]
    });

    await User.findByIdAndDelete(userId);

    req.session.destroy(err => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "Session cleanup failed" });
      }
      res.redirect("/auth/register");
    });

  } catch (err) {
    console.error("Account deletion error:", err);
    res.status(500).json({ message: "Error deleting account" });
  }
};
