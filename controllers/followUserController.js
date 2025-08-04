const User = require('../models/User');

exports.followUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.userId).populate('following');
    const userToFollow = await User.findById(req.params.id);

    if (!currentUser || !userToFollow) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isFollowing = currentUser.following.some(f => f._id.toString() === userToFollow._id.toString());

    if (isFollowing) {
      currentUser.following.pull(userToFollow._id);
      userToFollow.followers.pull(currentUser._id);
    } else {
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
    }

    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({ success: true, isFollowing: !isFollowing });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
