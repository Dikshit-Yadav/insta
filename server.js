const express = require('express');
const app = express();
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer');
const server = http.createServer(app);  
const io = socketIO(server);


const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profileRoutes');
const reelsRoutes = require('./routes/reelsRoutes');
const storyRoutes = require('./routes/storyRoutes');

const searchRoutes = require('./routes/searchRoutes');
const dashboardRoutes = require('./routes/dashboard'); 
const postRoutes = require('./routes/postRoutes');
const postsApiRoutes = require('./routes/posts'); 
const userRoutes = require('./routes/user');
const { followUser } = require('./controllers/followUserController');
const notificationRoutes = require('./routes/notifications');
const chatListRoutes = require('./routes/chatList');
const chatRoutes = require('./routes/chat');

const Story = require('./models/Story');
const User = require('./models/User');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('io', io);
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/auth', authRoutes);                
app.use('/users', userRoutes);                
app.use('/', dashboardRoutes);                
app.use('/', profileRoutes);  
app.use(notificationRoutes);             
app.use(reelsRoutes);                         
app.use('/', storyRoutes);                    
app.use('/', searchRoutes);                  
app.use('/', postRoutes);                    
app.use('/posts', postsApiRoutes);  
app.use('/', chatListRoutes);          
app.use('/chat', chatRoutes);

app.get('/', (req, res) => {
  res.render('login');
});

app.get('/forgot-password', (req, res) => {
  res.render('forget');
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const getEmail = await User.findOne({ email });
    if (!getEmail) return res.status(404).send("User not found");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "2004dikshityadav@gmail.com",
        pass: "svoe eqar fbnk kmek",
      },
    });

    const mailOptions = {
      from: "2004dikshityadav@gmail.com",
      to: email,
      subject: "Your Password",
      text: `Your password is: ${getEmail.password}`,
    };

    await transporter.sendMail(mailOptions);
    res.redirect("/");
  } catch (err) {
    console.error("Error in forgot-password route:", err);
    res.status(500).send("Internal server error");
  }
});

const Message = require('./models/Message');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinChatRoom', ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join('_');
    socket.join(roomId);
    console.log(`User joined Chat room: ${roomId}`);
  });

  socket.on('sendMessage', async ({ senderId, receiverId, content }) => {
    const roomId = [senderId, receiverId].sort().join('_');
console.log(`Sending message from ${senderId} to ${receiverId}: ${content}`);
    const newMessage = await Message.create({ sender: senderId, receiver: receiverId, content });

    io.to(roomId).emit('receiveMessage', {
      _id: newMessage._id,
      senderId,
      receiverId,
      content,
      createdAt: newMessage.createdAt
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// mongoose.connect('mongodb://localhost/instagram_clone')
async function main() {
  await mongoose.connect(process.env.MONGO_URI);
}
main().then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

