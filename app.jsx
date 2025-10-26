import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';

// Context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// API
const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Components
const Navbar = () => {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between">
        <Link to="/" className="text-xl font-bold">MERN Blog</Link>
        <div>
          {user ? (
            <>
              <Link to="/create" className="mr-4">Create Post</Link>
              <button onClick={logout}>Logout ({user.username})</button>
            </>
          ) : (
            <>
              <Link to="/login" className="mr-4">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const PostList = () => {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    api.get('/posts').then(res => setPosts(res.data));
  }, []);
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Blog Posts</h1>
      <div className="grid gap-4">
        {posts.map(post => (
          <div key={post._id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold">{post.title}</h2>
            <p className="text-gray-600">{post.content}</p>
            <p className="text-sm text-gray-400">By: {post.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(form.email, form.password);
  };
  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder="Email" value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          className="w-full p-2 border rounded" />
        <input type="password" placeholder="Password" value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          className="w-full p-2 border rounded" />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full">
          Login
        </button>
      </form>
    </div>
  );
};

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const { register } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(form);
  };
  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input placeholder="Username" value={form.username}
          onChange={e => setForm({...form, username: e.target.value})}
          className="w-full p-2 border rounded" />
        <input type="email" placeholder="Email" value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          className="w-full p-2 border rounded" />
        <input type="password" placeholder="Password" value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          className="w-full p-2 border rounded" />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full">
          Register
        </button>
      </form>
    </div>
  );
};

const CreatePost = () => {
  const [form, setForm] = useState({ title: '', content: '' });
  const { user } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/posts', form);
    setForm({ title: '', content: '' });
    alert('Post created!');
  };
  if (!user) return <div>Please login</div>;
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Create Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input placeholder="Title" value={form.title}
          onChange={e => setForm({...form, title: e.target.value})}
          className="w-full p-2 border rounded" />
        <textarea placeholder="Content" value={form.content}
          onChange={e => setForm({...form, content: e.target.value})}
          className="w-full p-2 border rounded h-32" />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Create Post
        </button>
      </form>
    </div>
  );
};

// Main App
export default function App() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) setUser(JSON.parse(userData));
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (err) {
      alert('Login failed');
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/register', userData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (err) {
      alert('Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <Routes>
            <Route path="/" element={<PostList />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/create" element={<CreatePost />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}