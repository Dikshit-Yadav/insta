const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middleware
function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login');
}

// Utils
const findUserByUsername = async (username) => {
  return await User.findOne({ username }).populate('followers').populate('following');
};

const findUserById = async (id) => {
  return await User.findById(id).populate('followers').populate('following');
};

// View own profile
// router.get('/profile', isAuthenticated, async (req, res) => {
//   try {
//     const user = await User.findById(req.session.userId)
//       .populate('savedPosts')  // Populate the saved posts
//       .populate('posts');      // Populate the posts

//     if (!user) return res.status(404).send('User not found');

//     res.render('profile', {
//       user: user,
//       posts: user.posts,         // Pass the user's posts to the template
//       savedPosts: user.savedPosts, // Pass savedPosts to the template
//       isOwnProfile: true,         // Use logic to determine if it's the own profile
//       loggedInUserId: req.session.userId,
//       isFollowing: user.followers.includes(req.session.userId)
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Server error');
//   }
// });




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

// View profile by username
router.get('/profile/:username', isAuthenticated, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await findUserByUsername(username);

    if (!user) return res.status(404).send('User not found');

    const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 });

    res.render('profile', {
      user,
      posts,
      isOwnProfile: req.session.username === username,
      loggedInUserId: req.session.userId,
      isFollowing: user.followers.some(follower => follower._id.toString() === req.session.userId)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Edit Profile Page
router.get('/edit-profile', isAuthenticated, async (req, res) => {
  try {
    const user = await findUserById(req.session.userId);
    res.render('edit-profile', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Handle Edit Profile Form
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

// Settings Page
router.get('/settings', isAuthenticated, async (req, res) => {
  try {
    const user = await findUserById(req.session.userId);
    res.render('settings', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Handle Settings Update
router.post('/settings', isAuthenticated, upload.single('profilePicFile'), async (req, res) => {
  try {
    const { username, email, bio, password } = req.body;
    const user = await User.findById(req.session.userId);

    if (!user) return res.status(404).send('User not found');

    if (req.file) user.profilePic = req.file.filename;
    if (username) user.username = username;
    if (email) user.email = email;
    if (bio) user.bio = bio;
    if (password) user.password = password; // ⚠️ Should hash password in production

    await user.save();
    res.redirect(`/profile/${user.username}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating settings');
  }
});

// Show Followers
router.get('/profile/:username/followers', isAuthenticated, async (req, res) => {
  try {
    const user = await findUserByUsername(req.params.username);
    res.render('followers', { user, followers: user.followers });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Show Following
router.get('/profile/:username/following', isAuthenticated, async (req, res) => {
  try {
    const user = await findUserByUsername(req.params.username);
    res.render('following', { user, following: user.following });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Follow / Unfollow Handlers
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
    }

    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error following user');
  }
});

router.post('/unfollow/:id', isAuthenticated, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.session.userId);

    if (!targetUser || !currentUser) return res.status(404).send('User not found');

    currentUser.following.pull(targetUser._id);
    targetUser.followers.pull(currentUser._id);

    await currentUser.save();
    await targetUser.save();

    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error unfollowing user');
  }
});

//Saved/Unsaved
router.get('/save/profile', (req, res) => {
  res.redirect('/profile'); // Redirect to the logged-in user's profile
});

// Save Post
router.post('/save/:postId', async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user.savedPosts.includes(req.params.postId)) {
    user.savedPosts.push(req.params.postId);
    await user.save();
  }
  res.redirect('profile');
});

router.get('/unsave/profile', (req, res) => {
  res.redirect('/profile'); // Redirect to the logged-in user's profile
});
router.post('/unsave/:postId', async (req, res) => {
  const user = await User.findById(req.session.userId);
  user.savedPosts.pull(req.params.postId);
  await user.save();
  res.redirect('profile');
});


module.exports = router;
