import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LogOut, Hash, Book, Send, Paperclip, BarChart2, Calendar, Calculator, GraduationCap, Layout, CheckCircle, XCircle, ArrowUp, FileText, MessageSquare, Bell, Coffee, Users, Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import { format, differenceInDays } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';
const API = axios.create({ baseURL: `${API_URL}/api` });

API.interceptors.request.use((req) => {
    if (localStorage.getItem('token')) req.headers['x-auth-token'] = localStorage.getItem('token');
    return req;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

// --- Auth ---
const Auth = ({ setAuth }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', semester: 2, department: 'CS' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const endpoint = isRegister ? '/auth/register' : '/auth/login';
        try {
            const res = await API.post(endpoint, formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setAuth(true);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border border-gray-100">
                <h1 className="text-3xl font-black mb-6 text-center tracking-tight text-gray-900">Campus OS</h1>
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />}
                    <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="Email Address" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    <button disabled={loading} className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 font-bold text-sm transition-all disabled:opacity-50">{loading ? 'Please wait...' : (isRegister ? 'Join Campus' : 'Sign In')}</button>
                </form>
                <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="w-full text-center mt-6 text-xs text-gray-500 hover:text-black font-medium">{isRegister ? "Have an account? Login" : "New student? Register"}</button>
            </div>
        </div>
    );
};

// --- LOGIC ---
const gradeToPoint = (marks) => {
    if (marks >= 90) return 10; if (marks >= 80) return 9; if (marks >= 70) return 8;
    if (marks >= 60) return 7; if (marks >= 50) return 6; if (marks >= 45) return 4; return 0;
};
const calculateSGPA = (marksData, subjects) => {
    let tqp = 0, tc = 0;
    subjects.forEach(sub => {
        const marks = parseFloat(marksData[sub._id] || 0);
        const credits = sub.credits || 3;
        tqp += (credits * gradeToPoint(marks)); tc += credits;
    });
    return tc === 0 ? 0 : (tqp / tc).toFixed(2);
};

// --- COMPONENTS ---

const FeedPost = ({ post, onVote, onPollVote }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const isVoted = post.votes.includes(user.id || user._id);
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">{post.userId?.name?.[0]}</div>
                <div><p className="text-sm font-bold text-gray-900">{post.userId?.name}</p><p className="text-[10px] text-gray-400">{format(new Date(post.createdAt), 'MMM d')}</p></div>
                {post.tag && post.tag !== 'general' && <span className="ml-auto text-[10px] bg-gray-100 px-2 py-1 rounded font-bold uppercase tracking-wider">{post.tag}</span>}
                {post.type === 'poll' && <span className="ml-auto text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded font-bold uppercase tracking-wider">POLL</span>}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            {post.type === 'poll' && (
                <div className="mt-4 space-y-2">
                    {post.pollOptions.map((opt, i) => {
                        const total = post.pollOptions.reduce((a, b) => a + b.voters.length, 0);
                        const pct = total === 0 ? 0 : Math.round((opt.voters.length / total) * 100);
                        return (
                            <div key={i} onClick={() => onPollVote(post._id, i)} className="relative h-8 bg-gray-50 rounded border border-gray-200 cursor-pointer overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-blue-100 transition-all duration-500" style={{ width: `${pct}%` }}></div>
                                <div className="absolute inset-0 flex justify-between items-center px-3 text-xs font-medium z-10"><span>{opt.text}</span><span>{pct}%</span></div>
                            </div>
                        )
                    })}
                </div>
            )}
            {/* FILE DISPLAY */}
            {post.fileUrl && <a href={`${API_URL}${post.fileUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-600 font-bold w-fit hover:bg-blue-100 transition"><FileText size={16} /> View Attachment</a>}

            <div className="mt-4 flex gap-4 border-t border-gray-50 pt-4">
                <button onClick={() => onVote(post._id)} className={`flex items-center gap-1 text-xs font-bold transition ${isVoted ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'}`}><ArrowUp size={16} /> {post.votes.length}</button>
            </div>
        </div>
    );
};

// --- MODE 1: CAMPUS MODE (Global) ---
const CampusMode = ({ user }) => {
    const [section, setSection] = useState('buzz'); // 'notices', 'buzz'
    const [posts, setPosts] = useState([]);

    // NEW: File Upload State
    const [postContent, setPostContent] = useState('');
    const [postFile, setPostFile] = useState(null); // Added File State
    const [isPollMode, setIsPollMode] = useState(false);
    const [pollOpts, setPollOpts] = useState(['', '']);

    useEffect(() => {
        API.get(`/posts?section=${section === 'notices' ? 'notice' : 'campus'}`).then(res => setPosts(res.data.data || res.data));
    }, [section]);

    const submitPost = async () => {
        const formData = new FormData();
        formData.append('section', section === 'notices' ? 'notice' : 'campus');
        formData.append('content', postContent);
        formData.append('type', isPollMode ? 'poll' : 'text');

        // NEW: Append File
        if (postFile) formData.append('file', postFile);

        if (isPollMode) formData.append('pollOptions', JSON.stringify(pollOpts));
        const res = await API.post('/posts', formData);
        setPosts([res.data.data || res.data, ...posts]);
        setPostContent('');
        setPostFile(null);
        setIsPollMode(false);
        setPollOpts(['', '']); // Reset poll options
    };

    const handleVote = async (pid) => { const res = await API.put(`/posts/${pid}/vote`); setPosts(posts.map(p => p._id === pid ? { ...p, votes: (res.data.data || res.data).votes } : p)); };
    const handlePollVote = async (pid, idx) => { const res = await API.put(`/posts/${pid}/poll`, { optionIndex: idx }); setPosts(posts.map(p => p._id === pid ? { ...p, pollOptions: (res.data.data || res.data).pollOptions } : p)); };

    return (
        <div className="flex h-full">
            <div className="w-64 bg-white border-r border-gray-100 flex flex-col pt-6">
                <div className="px-6 mb-6"><h2 className="text-xl font-black text-gray-900">Campus Life</h2><p className="text-xs text-gray-400">Global Feed</p></div>
                <div className="space-y-1 px-4">
                    <button onClick={() => setSection('notices')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${section === 'notices' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50'}`}><Bell size={16} className="inline mr-2" /> Notice Board</button>
                    <button onClick={() => setSection('buzz')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${section === 'buzz' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><Coffee size={16} className="inline mr-2" /> The Buzz</button>
                </div>
            </div>
            <div className="flex-1 bg-gray-50/50 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    {/* Post Input */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                        <textarea className="w-full text-sm outline-none resize-none placeholder-gray-400" rows="2" placeholder={`Post to ${section === 'notices' ? 'Notice Board' : 'The Buzz'}...`} value={postContent} onChange={e => setPostContent(e.target.value)} />
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                            <div className="flex gap-3">
                                <button onClick={() => setIsPollMode(!isPollMode)} className="text-gray-400 hover:text-blue-600"><BarChart2 size={20} /></button>
                                {/* NEW: File Button */}
                                <label className="cursor-pointer text-gray-400 hover:text-blue-600 flex items-center gap-2 text-xs font-bold">
                                    <Paperclip size={20} />
                                    {postFile && <span className="text-blue-600 truncate max-w-[100px]">{postFile.name}</span>}
                                    <input type="file" className="hidden" onChange={e => setPostFile(e.target.files[0])} />
                                </label>
                            </div>
                            <button onClick={submitPost} className="px-6 py-2 bg-black text-white text-xs font-bold rounded-full">Post</button>
                        </div>
                        {isPollMode && <div className="mt-3 space-y-2"><input className="w-full p-2 bg-gray-50 rounded text-xs" placeholder="Option 1" onChange={e => { const n = [...pollOpts]; n[0] = e.target.value; setPollOpts(n) }} /><input className="w-full p-2 bg-gray-50 rounded text-xs" placeholder="Option 2" onChange={e => { const n = [...pollOpts]; n[1] = e.target.value; setPollOpts(n) }} /></div>}
                    </div>
                    {posts.map(post => <FeedPost key={post._id} post={post} onVote={handleVote} onPollVote={handlePollVote} />)}
                </div>
            </div>
        </div>
    );
};

// --- MODE 2: ACADEMIC MODE (Subject Specific) ---
const AcademicMode = ({ user, subjects, activeSubject, setActiveSubject }) => {
    const [tab, setTab] = useState('feed');
    const [posts, setPosts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [deadlines, setDeadlines] = useState([]);
    const [attendance, setAttendance] = useState({ attended: 0, total: 0 });
    const [postContent, setPostContent] = useState('');
    const [isPollMode, setIsPollMode] = useState(false);
    const [postTag, setPostTag] = useState('general');
    const [pollOpts, setPollOpts] = useState(['', '']);
    const [messageText, setMessageText] = useState('');

    // Existing File State
    const [postFile, setPostFile] = useState(null);

    const [timetable, setTimetable] = useState({});
    const [marksData, setMarksData] = useState({});

    const socket = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (!activeSubject) return;
        socket.current = io(API_URL);
        socket.current.emit('join_room', activeSubject._id);
        API.get(`/posts?subjectId=${activeSubject._id}`).then(res => setPosts(res.data.data || res.data));
        API.get(`/messages/${activeSubject._id}`).then(res => setMessages(res.data.data || res.data));
        API.get(`/deadlines/${activeSubject._id}`).then(res => setDeadlines(res.data.data || res.data));
        API.get('/user/attendance').then(res => { const data = res.data.data || res.data; const record = data.find(r => r.subjectId === activeSubject._id); setAttendance(record || { attended: 0, total: 0 }); });
        API.get('/user/timetable').then(res => setTimetable(res.data.data || res.data));
        socket.current.on('receive_message', (data) => setMessages(prev => [...prev, data]));
        return () => socket.current.disconnect();
    }, [activeSubject]);

    useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

    const submitPost = async () => {
        const formData = new FormData();
        formData.append('subjectId', activeSubject._id); formData.append('content', postContent);
        formData.append('type', isPollMode ? 'poll' : 'request'); formData.append('tag', postTag);
        if (postFile) formData.append('file', postFile);
        if (isPollMode) formData.append('pollOptions', JSON.stringify(pollOpts));
        const res = await API.post('/posts', formData);
        setPosts([res.data.data || res.data, ...posts]); setPostContent(''); setPostFile(null); setIsPollMode(false); setPollOpts(['', '']);
    };
    const handleVote = async (pid) => { const res = await API.put(`/posts/${pid}/vote`); setPosts(posts.map(p => p._id === pid ? { ...p, votes: (res.data.data || res.data).votes } : p)); };
    const handlePollVote = async (pid, idx) => { const res = await API.put(`/posts/${pid}/poll`, { optionIndex: idx }); setPosts(posts.map(p => p._id === pid ? { ...p, pollOptions: (res.data.data || res.data).pollOptions } : p)); };
    const markAttendance = async (type) => { const newAttended = type === 'present' ? attendance.attended + 1 : attendance.attended; const newTotal = attendance.total + 1; setAttendance({ attended: newAttended, total: newTotal }); await API.put('/user/attendance', { subjectId: activeSubject._id, type }); };
    const sendMessage = async (e) => { e.preventDefault(); if (!messageText.trim()) return; const payload = { subjectId: activeSubject._id, userId: user.id || user._id, text: messageText, userName: user.name }; socket.current.emit('send_message', payload); setMessages(p => [...p, payload]); setMessageText(''); };
    const saveTimetable = async () => { await API.post('/user/timetable', { timetable }); alert("Saved"); };

    if (!activeSubject) return <div className="flex items-center justify-center h-full text-gray-300 font-bold text-xl">Select a Subject</div>;

    const pct = attendance.total === 0 ? 0 : Math.round((attendance.attended / attendance.total) * 100);
    const status = pct >= 85 ? { label: 'Eligible', color: 'text-green-600', bg: 'bg-green-100' } : pct >= 75 ? { label: 'Condonation', color: 'text-yellow-600', bg: 'bg-yellow-100' } : { label: 'Detained', color: 'text-red-600', bg: 'bg-red-100' };

    return (
        <div className="flex h-full">
            <div className="w-64 bg-white border-r border-gray-100 flex flex-col pt-6">
                <div className="px-6 mb-6"><h2 className="text-xl font-black text-gray-900">Academics</h2><p className="text-xs text-gray-400">Semester {user.semester}</p></div>
                <div className="flex-1 overflow-y-auto px-4 space-y-1">{subjects.map(sub => (<button key={sub._id} onClick={() => setActiveSubject(sub)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSubject?._id === sub._id ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>{sub.title}</button>))}</div>
            </div>
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                <header className="h-20 border-b border-gray-100 flex items-center px-8 justify-between bg-white/90 backdrop-blur z-10">
                    <h2 className="text-xl font-bold text-gray-900">{activeSubject.title}</h2>
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                        <button onClick={() => setTab('feed')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${tab === 'feed' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Feed</button>
                        <button onClick={() => setTab('tools')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${tab === 'tools' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Tools</button>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden flex">
                    {tab === 'feed' ? (
                        <>
                            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                                {deadlines.length > 0 && (<div className="mb-8 p-4 bg-yellow-50 border border-yellow-100 rounded-xl"><h4 className="text-xs font-bold text-yellow-700 uppercase mb-2 flex items-center gap-2"><Clock size={14} /> Upcoming Deadlines</h4><div className="space-y-2">{deadlines.map(d => (<div key={d._id} className="flex justify-between text-sm bg-white p-2 rounded shadow-sm text-gray-800"><span>{d.title}</span><span className="font-bold text-red-500">{differenceInDays(new Date(d.dueDate), new Date())} days left</span></div>))}</div></div>)}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                                    <textarea className="w-full text-sm outline-none resize-none placeholder-gray-400" rows="2" placeholder="Upload notes, Syllabus or ask doubt..." value={postContent} onChange={e => setPostContent(e.target.value)} />
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                                        <div className="flex gap-2">
                                            <select value={postTag} onChange={e => setPostTag(e.target.value)} className="text-xs bg-gray-50 px-3 py-1 rounded outline-none font-bold text-gray-600"><option value="general">General</option><option value="note">Notes</option><option value="syllabus">Syllabus</option><option value="pyq">PYQ</option></select>
                                            <button onClick={() => setIsPollMode(!isPollMode)} className="text-gray-400 hover:text-blue-600"><BarChart2 size={20} /></button>
                                            {/* FILE BUTTON ACADEMIC */}
                                            <label className="cursor-pointer text-gray-400 hover:text-blue-600 flex items-center gap-2">
                                                <Paperclip size={20} />
                                                {postFile && <span className="text-xs text-blue-600 font-bold max-w-[80px] truncate">{postFile.name}</span>}
                                                <input type="file" className="hidden" onChange={e => setPostFile(e.target.files[0])} />
                                            </label>
                                        </div>
                                        <button onClick={submitPost} className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-full">Post</button>
                                    </div>
                                    {isPollMode && <div className="mt-3 space-y-2"><input className="w-full p-2 bg-gray-50 rounded text-xs" placeholder="Option 1" onChange={e => { const n = [...pollOpts]; n[0] = e.target.value; setPollOpts(n) }} /><input className="w-full p-2 bg-gray-50 rounded text-xs" placeholder="Option 2" onChange={e => { const n = [...pollOpts]; n[1] = e.target.value; setPollOpts(n) }} /></div>}
                                </div>
                                {posts.map(post => <FeedPost key={post._id} post={post} onVote={handleVote} onPollVote={handlePollVote} />)}
                            </div>
                            <div className="w-80 border-l border-gray-100 flex flex-col bg-white">
                                <div className="p-4 border-b border-gray-100 font-bold text-xs text-gray-500 uppercase">Subject Chat</div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">{messages.map((m, i) => (<div key={i} className={`flex ${m.userId === (user.id || user._id) ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-2xl text-xs ${m.userId === (user.id || user._id) ? 'bg-black text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>{m.text}</div></div>))}<div ref={chatEndRef} /></div>
                                <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 relative"><input className="w-full py-3 pl-4 pr-12 bg-gray-50 rounded-xl text-xs outline-none" placeholder="Message..." value={messageText} onChange={e => setMessageText(e.target.value)} /><button className="absolute right-6 top-6 text-gray-400"><Send size={16} /></button></form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><h2 className="text-lg font-bold mb-4 flex gap-2 items-center"><CheckCircle size={18} /> Attendance</h2><div className="flex justify-between items-end mb-2"><span className="text-4xl font-black text-gray-900">{pct}%</span><span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${status.bg} ${status.color}`}>{status.label}</span></div><div className="w-full bg-gray-200 rounded-full h-1.5 mb-6"><div className={`h-full rounded-full ${pct >= 85 ? 'bg-green-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }}></div></div><div className="grid grid-cols-2 gap-3"><button onClick={() => markAttendance('present')} className="py-2 border hover:bg-green-50 rounded-xl text-xs font-bold">Present</button><button onClick={() => markAttendance('absent')} className="py-2 border hover:bg-red-50 rounded-xl text-xs font-bold">Absent</button></div></div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><h2 className="text-lg font-bold mb-4 flex gap-2 items-center"><GraduationCap size={18} /> SGPA Calc</h2><div className="space-y-2 h-40 overflow-y-auto">{subjects.map(sub => (<div key={sub._id} className="flex justify-between text-xs p-2 bg-gray-50 rounded"><span>{sub.title}</span><input type="number" className="w-12 text-center border rounded" placeholder="-" onChange={e => setMarksData(p => ({ ...p, [sub._id]: e.target.value }))} /></div>))}</div><div className="mt-4 text-center font-black text-3xl">{calculateSGPA(marksData, subjects)}</div></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><div className="flex justify-between mb-4"><h2 className="text-lg font-bold">Timetable</h2><button onClick={saveTimetable} className="text-xs bg-black text-white px-3 py-1 rounded">Save</button></div><div className="overflow-x-auto"><table className="w-full text-xs"><tbody>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (<tr key={d} className="border-b"><td className="font-bold py-3 text-gray-400">{d}</td>{['9', '10', '11', '12', '2', '3'].map(s => (<td key={s} className="p-1"><input className="w-full bg-gray-50 p-2 rounded" placeholder="-" value={timetable[`${d}-${s}:00`] || ''} onChange={e => setTimetable(p => ({ ...p, [`${d}-${s}:00`]: e.target.value }))} /></td>))}</tr>))}</tbody></table></div></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- ROOT ---
const App = () => {
    const [isAuth, setAuth] = useState(!!localStorage.getItem('token'));
    const [mode, setMode] = useState('academics');
    const [subjects, setSubjects] = useState([]);
    const [activeSubject, setActiveSubject] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => { if (isAuth && user) API.get(`/subjects/${user.semester}`).then(res => { const subjects = res.data.data || res.data; setSubjects(subjects); if (subjects.length > 0) setActiveSubject(subjects[0]); }); }, [isAuth]);
    const logout = () => { localStorage.clear(); setAuth(false); };

    if (!isAuth) return <Auth setAuth={setAuth} />;

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 selection:bg-black selection:text-white">
            <div className="w-20 bg-black flex flex-col items-center py-8 gap-8 z-20 shadow-2xl">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-xl tracking-tighter">C.</div>
                <div className="flex flex-col gap-6 w-full items-center"><button onClick={() => setMode('academics')} className={`p-3 rounded-xl transition-all ${mode === 'academics' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}><Book size={20} /></button><button onClick={() => setMode('campus')} className={`p-3 rounded-xl transition-all ${mode === 'campus' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}><Coffee size={20} /></button></div>
                <div className="mt-auto"><button onClick={logout} className="p-3 text-red-500 hover:bg-white/10 rounded-xl transition"><LogOut size={20} /></button></div>
            </div>
            <div className="flex-1 min-w-0 bg-white">
                {mode === 'academics' ? <AcademicMode user={user} subjects={subjects} activeSubject={activeSubject} setActiveSubject={setActiveSubject} /> : <CampusMode user={user} />}
            </div>
        </div>
    );
};

export default function Root() { return <Router><Routes><Route path="*" element={<App />} /></Routes></Router>; }
