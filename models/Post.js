const mongoose = require('mongoose');

// const commentSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   text: String,
//   createdAt: { type: Date, default: Date.now }
// });

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caption: String,
  postImage: String,
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
});

module.exports = mongoose.model('Post', postSchema);
