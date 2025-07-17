// testNotification.js

const mongoose = require('mongoose');
const Notification = require('./models/Notification');

// Replace with your MongoDB connection string
mongoose.connect('mongodb://127.0.0.1:27017/instagram_clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');

  try {
    await Notification.create({
        type: 'like', // or 'comment', or whatever types you support
        sender: '6636175f70aa4d515ae3fb03', // an existing user ObjectId
        receiver: '6636175f70aa4d515ae3fb03', // another user ObjectId
        post: '66361e2198c7f68e9bbd9b57', // optional, if it's a post-related notif
        message: 'Manual test notification'
      });
      
    console.log('✅ Notification inserted!');
  } catch (err) {
    console.error('❌ Error inserting notification:', err);
  }

  mongoose.disconnect();
})
.catch(err => console.error('MongoDB connection error:', err));
