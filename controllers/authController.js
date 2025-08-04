const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Story = require('../models/Story');
const Post = require('../models/Post');
const upload = require('../middleware/upload');
// let otpObj = {};
const transporter = require("../routes/utility/transport");


// exports.handelRegister = async (req, res) => {
//     const { username, email, password } = req.body;
//     try {
//         await User.create({ username, email, password });
//         res.redirect('/');
//     } catch (err) {
//         console.error(err);
//         if (err.code === 11000 && err.keyPattern && err.keyPattern.username) {
//             return res.status(400).send('Username already exists.');
//         } else if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
//             return res.status(400).send('Email already exists.');
//         }
//         res.status(400).send('Error registering user');
//     }
// }
exports.handelRegister = async (req, res) => {
  try {
    const { username, email, password} = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.send("User already exists");
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpObj = { username, email, password, otp };
    await transporter.sendMail({
      from:process.env.EMAIL_USER,
      to: email,
      subject: "Instagram OTP",
      text: `Your One-Time Password (OTP) is: ${otp}. It is valid for 10 minutes. Do not share this code with anyone. `
    });
    res.render("Verify", { email })
  } catch (err) {
    res.send("error: " + err);
  }
}

exports.handelVerify = async (req, res) => {
  const { email, otp } = req.body;

  console.log("entered OTP:", otp);
  console.log("stored OTP:", otpObj.otp);

  if (otpObj.otp !== otp) {
    return res.send("Invalid OTP");
  }

  const { username, password } = otpObj;
  const user = new User({ username, email: otpObj.email, password });
  await user.save();
  otpObj = {}
  res.redirect('/');
}

exports.handelUploadProfilePic = async (req, res) => {
    try {
        const userId = req.session.userId;
        let newProfilePic;

        if (req.file) {
            newProfilePic = req.file.filename;
        } else if (req.body.profilePicUrl) {
            newProfilePic = req.body.profilePicUrl;
        } else {
            return res.status(400).send('No profile picture provided.');
        }

        await User.findByIdAndUpdate(userId, { profilePic: newProfilePic });

        res.redirect(`/profile/${userId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating profile picture.');
    }
}

exports.handelLogin = async (req, res) => {
    const { email, password } = req.body;
    console.log({ email, password });

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send('Invalid credentials');
        }

        if (user.password === password) {
            req.session.userId = user._id;
            req.session.username = user.username;
            req.session.email = user.email;



            return res.redirect('/dashboard');
        } else {
            return res.status(400).send('Invalid credentials');
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Login failed');
    }
}

