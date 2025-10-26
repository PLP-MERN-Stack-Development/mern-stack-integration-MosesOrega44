import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mern-blog');

// User Model
const User = mongoose.model('User', {
  username: String,
  email: String,
  password: String
});

// Post Model
const Post = mongoose.model('Post', {
  title: String,
  content: String,
  author: String,
  createdAt: { type: Date, default: Date.now }
});

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes
// Auth
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id }, 'secret');
    res.json({ token, user: { id: user._id, username } });
  } catch (err) {
    res.status(400).json({ message: 'User exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user._id }, 'secret');
  res.json({ token, user: { id: user._id, username: user.username } });
});

// Posts
app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

app.post('/api/posts', auth, async (req, res) => {
  const post = new Post({ ...req.body, author: req.user.userId });
  await post.save();
  res.json(post);
});

app.put('/api/posts/:id', auth, async (req, res) => {
  const post = await Post.findOneAndUpdate(
    { _id: req.params.id, author: req.user.userId },
    req.body,
    { new: true }
  );
  res.json(post);
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  await Post.findOneAndDelete({ _id: req.params.id, author: req.user.userId });
  res.json({ message: 'Deleted' });
});

app.listen(5000, () => console.log('Server running on port 5000'));