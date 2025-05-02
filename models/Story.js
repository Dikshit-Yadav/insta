const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  media: String, // Image or video URL
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]  // 24 hours later
});

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);
