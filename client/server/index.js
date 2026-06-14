require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');

// --- Setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

mongoose.connect('mongodb://127.0.0.1:27017/campus-os')
    .then(() => console.log("✅ MongoDB Connected"));

// --- Models ---
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: { type: String, select: false },
    semester: Number,
    department: String,
    attendance: [{
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        attended: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    }]
});

const SubjectSchema = new mongoose.Schema({ title: String, code: String, semester: Number });

const DeadlineSchema = new mongoose.Schema({
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    title: String,
    dueDate: Date,
    createdAt: { type: Date, default: Date.now }
});

// UPDATED: Post Model for Polls
const PostSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    type: { type: String, enum: ['request', 'resource', 'poll'] }, 
    tag: { type: String, enum: ['general', 'note', 'pyq', 'syllabus', 'template'], default: 'general' },
    content: String,
    fileUrl: String,
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Post Upvotes
    // NEW: Polling Data
    pollOptions: [{
        text: String,
        voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Track who voted for this specific option
    }],
    createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    text: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Subject = mongoose.model('Subject', SubjectSchema);
const Post = mongoose.model('Post', PostSchema);
const Message = mongoose.model('Message', MessageSchema);
const Deadline = mongoose.model('Deadline', DeadlineSchema);

// --- Middleware (Auth) ---
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token' });
    try {
        const decoded = jwt.verify(token, 'campusSecret');
        req.user = decoded;
        next();
    } catch (e) { res.status(400).json({ msg: 'Invalid Token' }); }
};

// --- Routes ---
app.post('/api/register', async (req, res) => {
    const { name, email, password, semester, department } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const user = await User.create({ name, email, password: hashedPassword, semester, department });
        const token = jwt.sign({ id: user._id }, 'campusSecret');
        res.json({ token, user: { name, semester, department, id: user._id } });
    } catch (e) { res.status(400).json({ error: "Email exists" }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !await bcrypt.compare(password, user.password)) return res.status(400).json({ error: "Invalid" });
    const token = jwt.sign({ id: user._id }, 'campusSecret');
    res.json({ token, user: { name: user.name, semester: user.semester, id: user._id } });
});

app.get('/api/subjects/:semester', async (req, res) => {
    const subjects = await Subject.find({ semester: req.params.semester });
    res.json(subjects);
});

// Posts & Polls
app.get('/api/posts/:subjectId', async (req, res) => {
    const posts = await Post.find({ subjectId: req.params.subjectId }).populate('userId', 'name').sort({ createdAt: -1 });
    res.json(posts);
});

app.post('/api/posts', auth, upload.single('file'), async (req, res) => {
    const { subjectId, content, type, tag, pollOptions } = req.body;
    
    // Parse poll options if sent as string (from FormData)
    let parsedOptions = [];
    if (type === 'poll' && pollOptions) {
        parsedOptions = JSON.parse(pollOptions).map(opt => ({ text: opt, voters: [] }));
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const post = await Post.create({ 
        userId: req.user.id, subjectId, content, type, tag, fileUrl,
        pollOptions: parsedOptions
    });
    const populated = await Post.findById(post._id).populate('userId', 'name');
    res.json(populated);
});

app.put('/api/posts/:id/vote', auth, async (req, res) => {
    // Standard Upvote
    const post = await Post.findById(req.params.id);
    const userId = req.user.id;
    if (post.votes.includes(userId)) post.votes.pull(userId);
    else post.votes.push(userId);
    await post.save();
    res.json(post);
});

// NEW: Poll Voting Route
app.put('/api/posts/:id/poll', auth, async (req, res) => {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);
    const userId = req.user.id;

    // Remove user vote from ALL options first (ensure single vote)
    post.pollOptions.forEach(opt => opt.voters.pull(userId));

    // Add vote to selected option
    post.pollOptions[optionIndex].voters.push(userId);
    
    await post.save();
    res.json(post);
});

// Deadlines
app.get('/api/deadlines/:subjectId', async (req, res) => {
    const deadlines = await Deadline.find({ subjectId: req.params.subjectId }).sort({ dueDate: 1 });
    res.json(deadlines);
});
app.post('/api/deadlines', auth, async (req, res) => {
    const { subjectId, title, dueDate } = req.body;
    const deadline = await Deadline.create({ subjectId, title, dueDate });
    res.json(deadline);
});

// Chat & Attendance
app.get('/api/messages/:subjectId', async (req, res) => {
    const messages = await Message.find({ subjectId: req.params.subjectId }).populate('userId', 'name').sort({ createdAt: 1 });
    res.json(messages);
});
app.get('/api/attendance', auth, async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json(user.attendance);
});
app.put('/api/attendance', auth, async (req, res) => {
    const { subjectId, type } = req.body; 
    const user = await User.findById(req.user.id);
    let record = user.attendance.find(r => r.subjectId.toString() === subjectId);
    if (!record) {
        user.attendance.push({ subjectId, attended: 0, total: 0 });
        record = user.attendance[user.attendance.length - 1];
    }
    if (type === 'present') { record.attended++; record.total++; } 
    else if (type === 'absent') { record.total++; }
    await user.save();
    res.json(record);
});

// Socket
io.on('connection', (socket) => {
    socket.on('join_room', (id) => socket.join(id));
    socket.on('send_message', async (data) => {
        await Message.create({ userId: data.userId, subjectId: data.subjectId, text: data.text });
        socket.to(data.subjectId).emit('receive_message', data);
    });
});

server.listen(5001, () => console.log("🚀 Server running on 5001"));
