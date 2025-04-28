const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  video: String,
  caption: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reel', reelSchema);
