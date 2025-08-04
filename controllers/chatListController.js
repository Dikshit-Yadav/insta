const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');

exports.handelchatList = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.redirect('/login');

  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $project: {
          user: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender"
            ]
          },
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$user",
          lastMessageAt: { $first: "$createdAt" }
        }
      },
      { $sort: { lastMessageAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" }
    ]);

    res.render('chatList', {
      userId,
      conversations
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error on chat list load");
  }
}