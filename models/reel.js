const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  video: { type: String, required: true }, 
  caption: { type: String, trim: true },

  likes: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
  ],

  comments: [
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
  }
],

  views: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
  ],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reel', reelSchema);
