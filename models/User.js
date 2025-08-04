const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: 'default-profile.jpg' }, 
  bio: { type: String, default: '' },
  posts: [{ 
    imageUrl: String, 
    caption: String, 
    createdAt: { type: Date, default: Date.now } 
  }],
  stories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story'
  }],  
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reel' }]
});

module.exports = mongoose.model('User', userSchema);
