const User = require('../models/User');
const Post = require('../models/Post');
const Story = require('../models/Story');
const { isAuthenticated } = require('../middleware/authMiddleware');

exports.handelFeed = async (req, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = await User.findById(userId).populate('following');
  
      if (!currentUser) {
        return res.status(404).send('User not found');
      }
  
      const followingIds = currentUser.following.map(u => u._id);
  
      const feedPosts = await Post.find({ userId: { $in: followingIds } })
        .sort({ createdAt: -1 })
        .populate('userId', 'username profilePic');
  
      const excludeIds = [...followingIds, currentUser._id];
  
      const suggestedPosts = await Post.find({ userId: { $nin: excludeIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'username profilePic');
  
      res.render('feed', {
        posts: feedPosts,
        suggestedPosts,
        user: currentUser 
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error loading feed');
    }
  }