const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const upload = require('../middleware/multer')

exports.handelUploadStory = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).send('You need to be logged in to upload a story');
    }

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).send('No file uploaded');
    }

    console.log('File uploaded:', req.file);  

    const newStory = new Story({
      user: req.session.userId,  
      media: `/uploads/stories/${req.file.filename}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), 
    });
    
    await newStory.save();
    console.log('Story uploaded successfully');
    res.redirect('/dashboard');  
  } catch (err) {
    console.error('Error during story upload:', err);
    res.status(500).send('Error uploading story');
  }
}
exports.handelShowStory = async (req, res) => {
  try {
    let currentStory = await Story.findById(req.params.storyId)
      .populate('user', 'username')
      .populate('views', 'username') 
      .exec();

    if (!currentStory) return res.status(404).send('Story not found');
// const userId = req.session.userId.toString();
    const userId = req.session.userId.toString();

    const alreadyViewed = currentStory.views.some(viewer => 
      viewer._id.toString() === userId
    );

    if (!alreadyViewed) {
      currentStory.views.push(userId);
      await currentStory.save();

      currentStory = await Story.findById(req.params.storyId)
        .populate('user', 'username')
        .populate('views', 'username') 
        .exec();
    }

    console.log('Story viewed by:');
    currentStory.views.forEach((viewer, index) => {
      console.log(`${index + 1}. ${viewer.username}`);
    });

    const nextStory = await Story.findOne({ createdAt: { $gt: currentStory.createdAt } })
      .sort({ createdAt: 1 }).populate('user', 'username');

    const prevStory = await Story.findOne({ createdAt: { $lt: currentStory.createdAt } })
      .sort({ createdAt: -1 }).populate('user', 'username');

    res.render('storyViewer', {
      story: currentStory,
      nextStory,
      prevStory,
      userId
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}