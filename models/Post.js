const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  postImage: { type: String, required: true },
  caption: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
