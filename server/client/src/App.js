import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LogOut, Hash, Book, Send, Paperclip, MessageSquare, ArrowUp, FileText, CheckCircle, XCircle, Clock, BarChart2, Calculator, Filter } from 'lucide-react';
import { io } from 'socket.io-client';
import { format, differenceInDays } from 'date-fns';

const API_URL = 'http://127.0.0.1:5001'; 
const API = axios.create({ baseURL: `${API_URL}/api` });

API.interceptors.request.use((req) => {
  if (localStorage.getItem('token')) req.headers['x-auth-token'] = localStorage.getItem('token');
  return req;
});

// --- Auth ---
const Auth = ({ setAuth }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', semester: 2, department: 'CS' }); // Default Sem 2
  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/register' : '/login';
    try {
      const res = await API.post(endpoint, formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setAuth(true);
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Campus OS</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && <input className="w-full p-2 border rounded" placeholder="Name" onChange={e => setFormData({...formData, name: e.target.value})} />}
          <input className="w-full p-2 border rounded" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} />
          <input className="w-full p-2 border rounded" type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} />
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium">{isRegister ? 'Join' : 'Login'}</button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="w-full text-center mt-4 text-sm text-gray-500 hover:underline">{isRegister ? "Login" : "Register"}</button>
      </div>
    </div>
  );
};

// --- Dashboard ---
const Dashboard = ({ logout }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  
  // Data
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [attendance, setAttendance] = useState({ attended: 0, total: 0 });
  
  // UI Inputs
  const [postContent, setPostContent] = useState('');
  const [postFile, setPostFile] = useState(null);
  const [postTag, setPostTag] = useState('general');
  const [filter, setFilter] = useState('all');
  const [messageText, setMessageText] = useState('');
  
  // Feature State: Polls & GPA
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollOption1, setPollOption1] = useState('');
  const [pollOption2, setPollOption2] = useState('');
  const [currentCGPA, setCurrentCGPA] = useState('');
  const [targetCGPA, setTargetCGPA] = useState('');
  const [gpaResult, setGpaResult] = useState(null);
  const [newDeadlineTitle, setNewDeadlineTitle] = useState('');
  const [newDeadlineDate, setNewDeadlineDate] = useState('');

  const socket = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    socket.current = io(API_URL);
    API.get(`/subjects/${user.semester}`).then(res => {
        setSubjects(res.data);
        if (res.data.length > 0) setActiveSubject(res.data[0]);
    });
    socket.current.on('receive_message', (data) => setMessages((prev) => [...prev, data]));
    return () => socket.current.disconnect();
  }, [user.semester]);

  useEffect(() => {
    if (!activeSubject) return;
    socket.current.emit('join_room', activeSubject._id);
    
    API.get(`/posts/${activeSubject._id}`).then(res => setPosts(res.data));
    API.get(`/messages/${activeSubject._id}`).then(res => setMessages(res.data));
    API.get(`/deadlines/${activeSubject._id}`).then(res => setDeadlines(res.data));
    API.get('/attendance').then(res => {
        const record = res.data.find(r => r.subjectId === activeSubject._id);
        setAttendance(record || { attended: 0, total: 0 });
    });
  }, [activeSubject]);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  // Handlers
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const payload = { subjectId: activeSubject._id, userId: user.id || user._id, userName: user.name, text: messageText };
    socket.current.emit('send_message', payload);
    setMessages((prev) => [...prev, payload]); 
    setMessageText('');
  };

  const submitPost = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('subjectId', activeSubject._id);
    formData.append('content', postContent);
    formData.append('type', isPollMode ? 'poll' : (postFile ? 'resource' : 'request'));
    formData.append('tag', postTag);
    if (isPollMode) formData.append('pollOptions', JSON.stringify([pollOption1, pollOption2]));
    if (postFile) formData.append('file', postFile);
    
    const res = await API.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    setPosts([res.data, ...posts]);
    setPostContent(''); setPostFile(null); setIsPollMode(false); setPollOption1(''); setPollOption2('');
  };

  const submitDeadline = async () => {
      if(!newDeadlineTitle || !newDeadlineDate) return;
      const res = await API.post('/deadlines', { subjectId: activeSubject._id, title: newDeadlineTitle, dueDate: newDeadlineDate });
      setDeadlines([...deadlines, res.data]);
      setNewDeadlineTitle(''); setNewDeadlineDate('');
  };

  const toggleVote = async (postId) => {
      const res = await API.put(`/posts/${postId}/vote`);
      setPosts(posts.map(p => p._id === postId ? { ...p, votes: res.data.votes } : p));
  };

  const votePoll = async (postId, optionIndex) => {
      const res = await API.put(`/posts/${postId}/poll`, { optionIndex });
      setPosts(posts.map(p => p._id === postId ? { ...p, pollOptions: res.data.pollOptions } : p));
  };

  const markAttendance = async (type) => {
      const newAttended = type === 'present' ? attendance.attended + 1 : attendance.attended;
      const newTotal = attendance.total + 1;
      setAttendance({ attended: newAttended, total: newTotal });
      await API.put('/attendance', { subjectId: activeSubject._id, type });
  };

  const calculateGPA = () => {
      const creditsDone = (user.semester - 1) * 20;
      const creditsThisSem = 20;
      const totalCredits = creditsDone + creditsThisSem;
      const target = parseFloat(targetCGPA);
      const current = parseFloat(currentCGPA);
      const reqSGPA = ((target * totalCredits) - (current * creditsDone)) / creditsThisSem;
      setGpaResult(reqSGPA.toFixed(2));
  };

  const getPercentage = () => attendance.total === 0 ? 0 : Math.round((attendance.attended / attendance.total) * 100);
  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.tag === filter);

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans text-gray-800">
      
      {/* 1. Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <h1 className="font-bold text-lg text-blue-600">Campus OS</h1>
          <p className="text-xs text-gray-500">Sem {user.semester} • {user.department}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {subjects.map(sub => (
            <button key={sub._id} onClick={() => setActiveSubject(sub)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeSubject?._id === sub._id ? 'bg-white shadow-sm text-blue-700 border border-gray-200' : 'text-gray-600 hover:bg-gray-200'
                    }`}>
              <Hash size={15} /> {sub.title}
            </button>
          ))}
        </div>
        <div className="p-4 border-t"><button onClick={logout} className="flex gap-2 text-sm text-red-500"><LogOut size={16}/> Sign Out</button></div>
      </div>

      {/* 2. Main Feed */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">
        {activeSubject ? (
          <>
            {/* Header + Filter Chips */}
            <header className="h-24 border-b px-6 flex flex-col justify-center bg-white/80 backdrop-blur sticky top-0 z-10 gap-2">
              <h2 className="text-lg font-bold flex gap-2 items-center"><Book size={18} className="text-blue-600"/> {activeSubject.title}</h2>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {['all', 'note', 'pyq', 'syllabus', 'template'].map(f => (
                      <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition ${filter===f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{f}</button>
                  ))}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6">
                
                {/* Deadline Widget */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <h3 className="text-xs font-bold text-yellow-700 uppercase mb-2 flex items-center gap-2"><Clock size={14}/> Upcoming Deadlines</h3>
                    {deadlines.length > 0 ? (
                        <div className="space-y-2">
                            {deadlines.map(d => {
                                const daysLeft = differenceInDays(new Date(d.dueDate), new Date());
                                const color = daysLeft < 2 ? 'text-red-600' : 'text-gray-700';
                                return (
                                    <div key={d._id} className="flex justify-between items-center text-sm bg-white p-2 rounded shadow-sm">
                                        <span className="font-medium">{d.title}</span>
                                        <span className={`text-xs font-bold ${color}`}>{daysLeft < 0 ? 'Past Due' : `${daysLeft} days left`}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : <p className="text-xs text-yellow-600 italic">No pending deadlines.</p>}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-yellow-200">
                        <input className="bg-white px-2 py-1 text-xs rounded border border-yellow-300 w-full" placeholder="Task name..." value={newDeadlineTitle} onChange={e=>setNewDeadlineTitle(e.target.value)}/>
                        <input type="date" className="bg-white px-2 py-1 text-xs rounded border border-yellow-300" value={newDeadlineDate} onChange={e=>setNewDeadlineDate(e.target.value)}/>
                        <button onClick={submitDeadline} className="bg-yellow-600 text-white px-3 rounded text-xs font-bold">Add</button>
                    </div>
                </div>

                {/* Post/Poll Input */}
                <div className="bg-white p-4 rounded-xl shadow-sm border mb-8">
                    <div className="flex justify-between mb-2">
                        <textarea className="w-full text-sm outline-none resize-none" rows="2" placeholder="Share notes, ask doubts, or create a poll..." value={postContent} onChange={e=>setPostContent(e.target.value)}/>
                        <button onClick={() => setIsPollMode(!isPollMode)} className={`ml-2 p-2 rounded ${isPollMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`} title="Create Poll"><BarChart2 size={18}/></button>
                    </div>
                    {isPollMode && (
                        <div className="mb-3 space-y-2 bg-gray-50 p-2 rounded">
                            <input className="w-full text-xs p-2 border rounded" placeholder="Option 1 (e.g. Yes)" value={pollOption1} onChange={e=>setPollOption1(e.target.value)} />
                            <input className="w-full text-xs p-2 border rounded" placeholder="Option 2 (e.g. No)" value={pollOption2} onChange={e=>setPollOption2(e.target.value)} />
                        </div>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <div className="flex gap-2">
                             <label className="cursor-pointer flex gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600 items-center"><Paperclip size={12}/> {postFile ? postFile.name : "Attach"}<input type="file" className="hidden" onChange={e=>setPostFile(e.target.files[0])}/></label>
                             <select value={postTag} onChange={e=>setPostTag(e.target.value)} className="text-xs bg-gray-100 px-2 py-1 rounded outline-none cursor-pointer">
                                 <option value="general">General</option>
                                 <option value="note">Notes</option>
                                 <option value="pyq">PYQ</option>
                                 <option value="syllabus">Syllabus</option>
                             </select>
                        </div>
                        <button onClick={submitPost} className="px-4 py-1 bg-blue-600 text-white text-xs rounded font-bold">Post</button>
                    </div>
                </div>

                {/* Posts */}
                <div className="space-y-4">
                    {filteredPosts.map(post => {
                        const isVoted = post.votes.includes(user.id || user._id);
                        return (
                        <div key={post._id} className="bg-white p-5 rounded-xl border shadow-sm">
                            <div className="flex gap-2 items-center mb-2">
                                <span className="text-xs font-bold">{post.userId?.name}</span>
                                <span className="text-xs text-gray-400">• {format(new Date(post.createdAt), 'MMM d')}</span>
                                {post.type === 'poll' && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 rounded-full font-bold uppercase">POLL</span>}
                                {post.tag !== 'general' && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 rounded-full font-bold uppercase">{post.tag}</span>}
                            </div>
                            <p className="text-sm mb-3 whitespace-pre-wrap font-medium">{post.content}</p>
                            
                            {/* Poll Logic */}
                            {post.type === 'poll' && (
                                <div className="space-y-2 mb-3">
                                    {post.pollOptions.map((opt, idx) => {
                                        const totalVotes = post.pollOptions.reduce((acc, o) => acc + o.voters.length, 0);
                                        const pct = totalVotes === 0 ? 0 : Math.round((opt.voters.length / totalVotes) * 100);
                                        const hasVoted = opt.voters.includes(user.id || user._id);
                                        return (
                                            <div key={idx} onClick={() => votePoll(post._id, idx)} className="cursor-pointer relative h-8 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                                                <div className={`absolute top-0 left-0 h-full ${hasVoted ? 'bg-blue-200' : 'bg-gray-200'} transition-all duration-500`} style={{width: `${pct}%`}}></div>
                                                <div className="absolute top-0 left-0 h-full w-full flex justify-between items-center px-3 text-xs z-10">
                                                    <span className="font-bold">{opt.text}</span>
                                                    <span>{pct}%</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {post.fileUrl && <a href={`${API_URL}${post.fileUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-blue-50 rounded text-xs text-blue-600 font-medium w-fit"><FileText size={16}/> View Attachment</a>}
                            
                            <div className="mt-3 flex gap-4">
                                <button onClick={() => toggleVote(post._id)} className={`flex items-center gap-1 text-xs transition ${isVoted ? 'text-orange-600 font-bold' : 'text-gray-500 hover:text-orange-500'}`}><ArrowUp size={14} className={isVoted ? 'fill-orange-600' : ''}/> {post.votes.length}</button>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
          </>
        ) : <div className="flex-1 flex items-center justify-center text-gray-400">Select Subject</div>}
      </div>

      {/* 3. Right Panel (Utilities) */}
      <div className="w-80 bg-gray-50 flex flex-col">
        {/* Attendance */}
        <div className="p-4 bg-white border-b">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Attendance</h4>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between items-end mb-2">
                   <span className="text-3xl font-black text-gray-800">{getPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{width: `${getPercentage()}%`}}></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => markAttendance('present')} className="flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition"><CheckCircle size={14} /> Present</button>
                    <button onClick={() => markAttendance('absent')} className="flex items-center justify-center gap-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition"><XCircle size={14} /> Absent</button>
                </div>
            </div>
        </div>

        {/* GPA Calculator */}
        <div className="p-4 bg-white border-b">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Calculator size={12}/> GPA Predictor</h4>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <div className="flex gap-2">
                    <input className="w-1/2 p-2 text-xs border rounded" placeholder="Current CGPA" value={currentCGPA} onChange={e=>setCurrentCGPA(e.target.value)} />
                    <input className="w-1/2 p-2 text-xs border rounded" placeholder="Target CGPA" value={targetCGPA} onChange={e=>setTargetCGPA(e.target.value)} />
                </div>
                <button onClick={calculateGPA} className="w-full bg-gray-800 text-white py-2 rounded text-xs font-bold hover:bg-black">Calculate Needed SGPA</button>
                {gpaResult && <div className="mt-2 text-center p-2 bg-yellow-50 text-yellow-800 text-xs rounded font-medium">Get <span className="font-bold text-sm">{gpaResult}</span> this sem!</div>}
            </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-[200px] bg-white">
             <div className="p-3 bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase flex justify-between">
                <span>Class Chat</span> <span className="text-green-500">● Live</span>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.userId === (user.id||user._id) ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-2 rounded-xl text-xs ${msg.userId === (user.id||user._id) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{msg.text}</div>
                    </div>
                 ))}
                 <div ref={chatEndRef} />
             </div>
             <form onSubmit={sendMessage} className="p-3 border-t bg-gray-50 relative">
                 <input className="w-full py-2 pl-3 pr-10 bg-white border rounded-lg text-xs outline-none" placeholder="Message..." value={messageText} onChange={e=>setMessageText(e.target.value)}/>
                 <button className="absolute right-5 top-5 text-blue-600"><Send size={14}/></button>
             </form>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isAuth, setAuth] = useState(!!localStorage.getItem('token'));
  return (
    <Router>
      <Routes>
        <Route path="/" element={!isAuth ? <Auth setAuth={setAuth} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={isAuth ? <Dashboard logout={() => { localStorage.removeItem('token'); setAuth(false); }} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
