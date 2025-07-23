const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const Story = require('../models/Story');

const { isAuthenticated } = require('../middleware/authMiddleware');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage });

// router.get('/posts/upload', isAuthenticated, (req, res) => {
//   res.render('upload'); // Render the post upload page
// });

router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const posts = await Post.find({ userId: userId }).sort({ createdAt: -1 }); 

    res.render('profile', { posts });
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to load profile.');
  }
});


router.get('/posts/upload', isAuthenticated, async(req, res) => {

  const user = await User.findById(req.session.userId);
res.render('upload', { user });

});


router.post('/posts/upload', isAuthenticated, upload.single('postImage'), async (req, res) => {
  try {
    const { caption } = req.body; 
    const userId = req.session.userId; 
    const postImage = req.file ? `/uploads/${req.file.filename}` : null; 

    if (!postImage) {
      return res.status(400).send('Image upload is required.');
    }

    if (!userId) {
      return res.status(400).send('You must be logged in to upload a post.');
    }

    const newPost = new Post({
      userId: userId,
      caption: caption,
      postImage: postImage
    });

    await newPost.save();
    await User.findByIdAndUpdate(
      userId,
      { $push: { posts: newPost._id } }, 
      { new: true }
    );
    res.redirect('/profile');
  }
   catch (error) {
    console.error(error);
    res.status(500).send('Failed to upload post.');
  }
});

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

router.get('/feed', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const currentUser = await User.findById(userId).populate('following');

    const followingIds = currentUser.following.map(u => u._id);

    const feedPosts = await Post.find({ userId: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .populate('userId', 'username profilePic'); 
  
    const excludeIds = [...followingIds, currentUser._id];

    const suggestedPosts = await Post.find({ userId: { $nin: excludeIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'username profilePic')

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
});

router.post('/posts/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user');
    
    if (!post) return res.status(404).send("Post not found");

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

    if (req.session.userId !== post.user._id.toString()) {
      await Notification.create({
        recipient: post.user._id, 
        sender: req.session.userId, 
        type: 'comment', 
        message: 'commented on your post' 
      });
    }

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

   
    if (req.session.userId !== userToFollow._id.toString()) {
      await Notification.create({
        recipient: userToFollow._id, 
        sender: req.session.userId,
        type: 'follow', 
        message: 'started following you'
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

      const notification = new Notification({
        sender: currentUser._id,
        receiver: targetUser._id,
        type: 'follow',
        message: `${currentUser.username} started following you.`
      });
      await notification.save();
      console.log(` Notification created for ${targetUser.username} from ${currentUser.username}`);
    }

    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error following user');
  }
});


module.exports = router;
