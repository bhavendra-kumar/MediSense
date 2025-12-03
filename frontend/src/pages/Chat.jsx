import React, { useState, useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import aiService from '../services/aiService';
import Alert from '../components/Alert';
import { speakText, stopSpeaking, getVoiceLangCode } from '../utils/speech';

const Chat = () => {
  const { t, i18n } = useTranslation();
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [isListening, setIsListening] = useState(false);
  const [alertState, setAlertState] = useState({ show: false, type: 'info', message: '' });

  const [recentConversations, setRecentConversations] = useState([]); // sidebar recent items with local storage
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversationsMap, setConversationsMap] = useState({}); // id -> messages array

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const showAlert = (type, message) => {
    setAlertState({ show: true, type, message });
  };

  // Load conversations from localStorage and seed with backend history
  useEffect(() => {
    const init = async () => {
      // 1) Restore from localStorage if present
      try {
        const raw = localStorage.getItem('medisense:chatConversations');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.conversations && parsed.activeId) {
            setRecentConversations(parsed.conversations || []);
            setConversationsMap(parsed.map || {});
            setActiveConversationId(parsed.activeId);
            const initialMessages = parsed.map?.[parsed.activeId] || [];
            setMessages(initialMessages);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to restore chat conversations from storage', e);
      }

      // 2) Fallback to backend chat history as a single conversation
      try {
        const response = await aiService.getChatHistory();
        if (response.success) {
          const formattedMessages =
            response.history?.map((msg, idx) => ({
              id: idx,
              sender: msg.role === 'user' ? 'user' : 'ai',
              text: msg.content,
              timestamp: new Date(),
            })) || [];

          if (formattedMessages.length) {
            const firstUser = formattedMessages.find((m) => m.sender === 'user');
            const convId = `c-${Date.now()}`;
            const conv = {
              id: convId,
              title: firstUser?.text?.slice(0, 40) || t('chat.recentConversation') || 'Previous conversation',
            };
            setRecentConversations([conv]);
            setConversationsMap({ [convId]: formattedMessages });
            setActiveConversationId(convId);
            setMessages(formattedMessages);
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };

    init();
  }, [user?.id, t]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🎤 Setup browser speech recognition (ChatGPT-like mic)
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, [language]);

  const handleToggleMic = () => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      showAlert('error', 'Microphone / speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.lang = getVoiceLangCode(language);
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  const persistConversations = (conversations, map, activeId) => {
    try {
      localStorage.setItem(
        'medisense:chatConversations',
        JSON.stringify({ conversations, map, activeId })
      );
    } catch (e) {
      console.warn('Failed to persist chat conversations', e);
    }
  };

  const startNewChat = () => {
    const newId = `c-${Date.now()}`;
    setActiveConversationId(newId);
    setMessages([]);
    setConversationsMap((prev) => {
      const next = { ...prev, [newId]: [] };
      persistConversations(recentConversations, next, newId);
      return next;
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    const userMsg = {
      id: messages.length,
      sender: 'user',
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await aiService.sendMessage(inputMessage, language);

      if (response.success) {
        const aiText = response.data.aiResponse;

        const aiMsg = {
          id: messages.length + 1,
          sender: 'ai',
          text: aiText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        // update conversations map and recent list
        setConversationsMap((prevMap) => {
          const convId = activeConversationId || `c-${Date.now()}`;
          const existingMessages = prevMap[convId] || [];
          const updatedMessages = [...existingMessages, userMsg, aiMsg];
          const nextMap = { ...prevMap, [convId]: updatedMessages };

          const title = userMsg.text.slice(0, 40) || t('chat.recentConversation') || 'Conversation';
          setRecentConversations((prevConvs) => {
            const existing = prevConvs.find((c) => c.id === convId);
            const updatedConv = { id: convId, title };
            const without = prevConvs.filter((c) => c.id !== convId);
            const nextConvs = [updatedConv, ...without];
            persistConversations(nextConvs, nextMap, convId);
            setActiveConversationId(convId);
            return nextConvs;
          });

          return nextMap;
        });
      } else {
        const errorMsg = {
          id: messages.length + 1,
          sender: 'ai',
          text: 'Sorry, I could not get a response from the assistant.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMsg = {
        id: messages.length + 1,
        sender: 'ai',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear chat history?')) {
      try {
        await aiService.clearChatHistory();
        setMessages([]);
        setRecentConversations([]);
        setConversationsMap({});
        setActiveConversationId(null);
        persistConversations([], {}, null);
        showAlert('success', 'Chat history cleared!');
      } catch (error) {
        console.error('Failed to clear history:', error);
        showAlert('error', 'Failed to clear history. Please try again.');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Alert
        type={alertState.type}
        message={alertState.message}
        show={alertState.show}
        autoCloseMs={3200}
        onClose={() => setAlertState((prev) => ({ ...prev, show: false }))}
      />

      {/* Sidebar like ChatGPT */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-slate-800 bg-slate-950/90 p-4 gap-3">
        <button
          type="button"
          onClick={startNewChat}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900 hover:border-emerald-500/70 transition"
        >
          <span className="text-lg">＋</span>
          <span>New chat</span>
        </button>

        <div className="mt-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Recent
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {recentConversations.length === 0 ? (
            <p className="text-xs text-slate-500 mt-2">No recent conversations yet.</p>
          ) : (
            recentConversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => {
                  setActiveConversationId(conv.id);
                  setMessages(conversationsMap[conv.id] || []);
                }}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800/80 ${
                  conv.id === activeConversationId ? 'bg-slate-800 border border-emerald-500/60' : ''
                }`}
              >
                <span className="truncate flex-1">{conv.title}</span>
              </button>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
          <p className="truncate">{user?.email}</p>
          <p className="mt-1">Experimental AI health assistant.</p>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col max-h-screen">
        {/* Header */}
        <header className="border-b border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between gap-3 bg-slate-950/90 backdrop-blur">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-50 flex items-center gap-2">
              <span>💬</span> {t('Ask for Medical Conditions')}
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ask questions in simple language and to Health Advicer.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="ta">தமிழ்</option>
              <option value="te">తెలుగు</option>
              <option value="bn">বাংলা</option>
              <option value="kn">ಕನ್ನಡ</option>
              <option value="ml">മലയാളം</option>
              <option value="pa">ਪੰਜਾਬੀ</option>
              <option value="gu">ગુજરાતી</option>
              <option value="mr">मराठी</option>
              <option value="or">ଓଡିଆ</option>
            </select>
          </div>
        </header>

        {/* Messages area */}
        <section className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 gap-3">
              <p className="text-lg font-medium">Chat, Ask, Understand, No waiting, No appointments.</p>
              <p className="text-sm max-w-md">
                Describe your symptoms and general health goals.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-2xl w-full flex gap-3">
                  {msg.sender === 'ai' && (
                    <div className="mt-1 h-7 w-7 flex items-center justify-center rounded-full bg-emerald-500/20 text-sm">
                      🧠
                    </div>
                  )}
                  <div
                    className={`flex-1 rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap border ${
                      msg.sender === 'user'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-900/80 text-slate-100 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <p className="flex-1 text-sm leading-relaxed">{msg.text}</p>
                      {msg.sender === 'ai' && (
                        <button
                          type="button"
                          onClick={() => speakText(msg.text)}
                          className="text-xs text-slate-400 hover:text-slate-100"
                          title={t('chat.listenReply') || 'Listen'}
                        >
                          🔊
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex w-full justify-start">
              <div className="max-w-2xl w-full flex gap-3">
                <div className="mt-1 h-7 w-7 flex items-center justify-center rounded-full bg-emerald-500/20 text-sm">
                  🧠
                </div>
                <div className="flex-1 rounded-2xl px-4 py-3 text-sm bg-slate-900/80 text-slate-300 border border-slate-800 flex items-center gap-2">
                  <span>Thinking</span>
                  <span className="flex gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </section>

        {/* Input area (bottom bar, ChatGPT-style) */}
        <footer className="border-t border-slate-800 px-4 sm:px-8 py-3 bg-gradient-to-t from-slate-950 via-slate-950/95 to-slate-950/80">
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            {/* Quick prompt chips */}
            <div className="flex flex-wrap gap-2 mb-1">
              {[
                'Explain my lab report in simple terms',
                'Give me gentle lifestyle tips to improve my health',
                'What questions should I ask my doctor about diabetes?',
                'Help me understand my blood pressure report',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInputMessage(prompt)}
                  className="text-[11px] px-3 py-1 rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:border-emerald-500/60 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMic}
                className={`flex items-center justify-center h-10 w-10 rounded-full border text-sm transition ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_0_1px_rgba(248,113,113,0.6)]'
                    : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
                title={isListening ? 'Stop listening' : 'Tap to speak'}
              >
                {isListening ? '⏹' : '🎤'}
              </button>

              <div className="flex-1 flex items-center rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-1">
                <textarea
                  rows={1}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={t('chat.typeMessage') || 'Send a message...'}
                  disabled={loading}
                  className="flex-1 resize-none bg-transparent text-sm text-slate-50 placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-slate-950 text-sm font-semibold disabled:opacity-50 hover:bg-emerald-400 transition"
                >
                  ⮞
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <button
                type="button"
                onClick={stopSpeaking}
                className="hover:text-slate-200 underline-offset-2 hover:underline"
              >
                🔇 Stop speaking
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                className="hover:text-rose-300 underline-offset-2 hover:underline"
              >
                {t('chat.clearHistory') || 'Clear history'}
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Chat;
