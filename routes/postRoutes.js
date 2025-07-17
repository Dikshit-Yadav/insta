const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');

const { isAuthenticated } = require('../middleware/authMiddleware'); // Middleware to check if user is authenticated

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Save the uploaded files in the 'public/uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Ensure unique filenames by appending timestamp
  }
});

const upload = multer({ storage });

// Route for uploading a post (only accessible to logged-in users)
// router.get('/posts/upload', isAuthenticated, (req, res) => {
//   res.render('upload'); // Render the post upload page
// });

// Route to render user's profile page with posts
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Find posts by the logged-in user
    const posts = await Post.find({ userId: userId }).sort({ createdAt: -1 }); // Sort by newest first

    // Render the profile page and pass the posts
    res.render('profile', { posts });
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to load profile.');
  }
});

// Route for uploading a post, with both authentication check and session-based userId passing
router.get('/posts/upload', isAuthenticated, (req, res) => {
  const userId = req.session.userId;
  res.render('upload', { userId }); // Ensure the session userId is passed to the view
});


// Handle post upload
router.post('/posts/upload', isAuthenticated, upload.single('postImage'), async (req, res) => {
  try {
    const { caption } = req.body; // Get caption from form
    const userId = req.session.userId; // Get userId from session (change from username)
    const postImage = req.file ? `/uploads/${req.file.filename}` : null; // Save image path

    if (!postImage) {
      return res.status(400).send('Image upload is required.');
    }

    if (!userId) {
      return res.status(400).send('You must be logged in to upload a post.');
    }

    // Create a new post object with the userId, caption, and image path
    const newPost = new Post({
      userId: userId,
      // user: userId,  // Ensure we save the userId
      caption: caption,
      postImage: postImage
    });

    // Save the new post to the database
    await newPost.save();
    await User.findByIdAndUpdate(
      userId,
      { $push: { posts: newPost._id } }, // <-- push post id into posts array
      { new: true }
    );
    res.redirect('/profile'); // Redirect to profile after successful upload
  }
   catch (error) {
    console.error(error);
    res.status(500).send('Failed to upload post.');
  }
});

// Like/Unlike a post
router.post('/posts/:id/like', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.session.userId;

    if (!post) return res.status(404).send('Post not found');

    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId); // like
    } else {
      post.likes.splice(index, 1); // unlike
    }

    await post.save();
    res.redirect('/profile'); // or use AJAX in frontend
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Add a comment
router.post('/posts/:id/comment', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    const comment = {
      user: req.session.userId,
      text: req.body.comment
    };

    post.comments.push(comment);
    await post.save();
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Feed route showing followed users' posts and suggested posts
router.get('/feed', isAuthenticated, async (req, res) => {
  try {
    // Get the currently authenticated user
    const userId = req.session.userId;
    const currentUser = await User.findById(userId).populate('following');

    // Get the list of users the current user is following
    const followingIds = currentUser.following.map(u => u._id);

    // Get the posts from the users the current user is following
    const feedPosts = await Post.find({ userId: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .populate('userId', 'username profilePic'); // Populate user data (username, profilePic) for each post

    // Exclude the current user and the people they follow from the suggested posts
    const excludeIds = [...followingIds, currentUser._id];

    // Get suggested posts from users the current user isn't following
    const suggestedPosts = await Post.find({ userId: { $nin: excludeIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'username profilePic'); // Populate user data for suggested posts

    // Get the stories (if you have them in the database)
    const stories = await Story.find()
      .populate('user', 'username profilePic')  // Populate the user data for stories
      .sort({ createdAt: -1 });

    // Render the feed page with the posts, suggested posts, current user, and stories
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
});

router.post('/posts/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user');
    
    if (!post) return res.status(404).send("Post not found");

    // Avoid notifying yourself
    if (req.session.userId !== post.user._id.toString()) {
      await Notification.create({
        recipient: post.user._id,
        sender: req.session.userId,
        type: 'like',
        message: 'liked your post'
      });
    }

    // TODO: Handle actual like logic (e.g., save user to post.likes array)

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to like post");
  }
});

router.post('/posts/:id/comment', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user');
    
    if (!post) return res.status(404).send("Post not found");

    // Avoid notifying yourself
    if (req.session.userId !== post.user._id.toString()) {
      await Notification.create({
        recipient: post.user._id, // The post owner
        sender: req.session.userId, // The commenter
        type: 'comment', // Notification type
        message: 'commented on your post' // Notification message
      });
    }

    // Handle actual comment logic here: saving comment to the database
    const newComment = new Comment({
      postId: post._id,
      userId: req.session.userId,
      content: req.body.comment // Assuming comment content is in the request body
    });

    await newComment.save();

    // Optionally: Add comment to the post's comments array if needed
    post.comments.push(newComment._id);
    await post.save();

    // Redirect after commenting
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to comment on post");
  }
});


router.post('/users/:id/follow', async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    
    if (!userToFollow) return res.status(404).send("User not found");

    // Avoid notifying yourself
    if (req.session.userId !== userToFollow._id.toString()) {
      await Notification.create({
        recipient: userToFollow._id, // The user being followed
        sender: req.session.userId, // The follower
        type: 'follow', // Notification type
        message: 'started following you' // Notification message
      });
    }

    // Handle actual follow logic here (e.g., adding to followers array)
    const currentUser = await User.findById(req.session.userId);
    
    // Avoid duplicate follows (optional)
    if (!currentUser.following.includes(userToFollow._id)) {
      currentUser.following.push(userToFollow._id); // Add to following array
      userToFollow.followers.push(req.session.userId); // Add to followers array
      await currentUser.save();
      await userToFollow.save();
    }

    // Redirect after following
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to follow user");
  }
});

// Follow User
router.post('/follow/:id', isAuthenticated, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.session.userId); // or req.user._id

    if (!targetUser || !currentUser) return res.status(404).send('User not found');
    if (targetUser._id.equals(currentUser._id)) return res.status(400).send('Cannot follow yourself');

    // Check if not already following
    if (!currentUser.following.includes(targetUser._id)) {
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);

      await currentUser.save();
      await targetUser.save();

      // Create Notification
      const notification = new Notification({
        sender: currentUser._id,
        receiver: targetUser._id,
        type: 'follow',
        message: `${currentUser.username} started following you.`
      });
      await notification.save();
      console.log(`✅ Notification created for ${targetUser.username} from ${currentUser.username}`);
    }

    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error following user');
  }
});


module.exports = router;
