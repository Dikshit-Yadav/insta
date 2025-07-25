const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  media: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]  
});

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);
