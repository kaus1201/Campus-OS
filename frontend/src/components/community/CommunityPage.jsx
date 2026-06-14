import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchMessages, sendMessage } from '../../api';
import { MessageCircle, Send, Users } from 'lucide-react';

function formatRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CommunityPage() {
  const [username, setUsername] = useState(
    () => localStorage.getItem('campus_os_username') || ''
  );
  const [nameInput, setNameInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      const data = await fetchMessages();
      const list = Array.isArray(data) ? data : data.messages || [];
      setMessages(list);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    if (!username) return;

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [username, loadMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  const handleSetName = (e) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    localStorage.setItem('campus_os_username', name);
    setUsername(name);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      await sendMessage({ sender: username, content });
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // Username prompt
  if (!username) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <form
          onSubmit={handleSetName}
          className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm text-center space-y-5 shadow-sm"
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Users size={32} className="text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Join the Community</h2>
            <p className="text-gray-500 text-sm">Choose a display name to start chatting</p>
          </div>

          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your display name..."
            required
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm text-center focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-300"
          />

          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm cursor-pointer"
          >
            Enter Chat
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <MessageCircle size={22} className="text-blue-500" /> Community
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Chat with your campus community
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-gray-700 text-xs font-bold">{username}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 md:px-8 space-y-3 pb-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <MessageCircle size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-bold text-gray-900 mb-1">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender === username;
            return (
              <div
                key={msg.id || msg._id || index}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[75%] md:max-w-[60%] px-4 py-3 rounded-2xl shadow-sm
                    transition-all duration-300
                    ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                    }
                  `}
                >
                  {!isMe && (
                    <p className="text-xs font-bold text-blue-600 mb-1">
                      {msg.sender}
                    </p>
                  )}
                  <p className={`text-sm leading-relaxed break-words ${isMe ? 'text-white' : 'text-gray-700'}`}>
                    {msg.content || msg.body || msg.message}
                  </p>
                  <p
                    className={`text-[10px] mt-1.5 font-medium ${
                      isMe ? 'text-blue-200 text-right' : 'text-gray-400'
                    }`}
                  >
                    {formatRelativeTime(msg.created_at || msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 md:px-8 pb-6 md:pb-8">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer shrink-0 shadow-sm flex items-center justify-center h-10 w-12"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
