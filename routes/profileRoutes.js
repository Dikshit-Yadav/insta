const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Notification = require('../models/Notification');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login');
}

const findUserByUsername = async (username) => {
  return await User.findOne({ username }).populate('followers').populate('following');
};

const findUserById = async (id) => {
  return await User.findById(id).populate('followers').populate('following');
};

router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).send('User not found');
    res.redirect(`/profile/${user.username}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/profile/:username', isAuthenticated, async (req, res) => {
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


    console.log("reel:", reels);
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
});

router.get('/reels',isAuthenticated, async(req,res)=>{
  try{
    req.render("uploadReel.ejs");
  }catch{
    console.error(err);
    res.status(500).send('Server error on load reels');
  }
})

router.get('/edit-profile', isAuthenticated, async (req, res) => {
  try {
    const user = await findUserById(req.session.userId);
    res.render('edit-profile', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/edit-profile', isAuthenticated, async (req, res) => {
  try {
    const { bio } = req.body;
    await User.findByIdAndUpdate(req.session.userId, { bio });
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile');
  }
});

router.get('/settings', isAuthenticated, async (req, res) => {
  try {
    const user = await findUserById(req.session.userId);
    res.render('settings', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/settings', isAuthenticated, upload.single('profilePicFile'), async (req, res) => {
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
});

router.get('/profile/:username/followers', isAuthenticated, async (req, res) => {
  try {
    const user = await findUserByUsername(req.params.username);
    res.render('followers', { user, followers: user.followers });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/profile/:username/following', isAuthenticated, async (req, res) => {
  try {
    const user = await findUserByUsername(req.params.username);
    res.render('following', { user, following: user.following });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/save/profile', (req, res) => {
  res.redirect('/profile');
});

router.post('/follow/:id', isAuthenticated, async (req, res) => {
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
});


router.post('/save/:postId', async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user.savedPosts.includes(req.params.postId)) {
    user.savedPosts.push(req.params.postId);
    await user.save();
  }
  res.redirect('profile');
});

router.get('/unsave/profile', (req, res) => {
  res.redirect('/profile');
});
router.post('/unsave/:postId', async (req, res) => {
  const user = await User.findById(req.session.userId);
  user.savedPosts.pull(req.params.postId);
  await user.save();
  res.redirect('profile');
});


module.exports = router;
