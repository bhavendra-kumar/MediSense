import React, { useState, useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import aiService from '../services/aiService';

const Chat = () => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [healthTips, setHealthTips] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState([]);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load chat + tips
  useEffect(() => {
    fetchChatHistory();
    fetchHealthTips();
  }, [user?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🔊 Load available voices for speechSynthesis
  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // 🎤 Setup browser speech recognition
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

  // Map app language code -> voice language code
  const getVoiceLangCode = (lang) => {
    switch (lang) {
      case 'hi':
        return 'hi-IN';
      case 'ta':
        return 'ta-IN';
      case 'te':
        return 'te-IN';
      case 'bn':
        return 'bn-IN';
      case 'kn':
        return 'kn-IN';
      case 'ml':
        return 'ml-IN';
      case 'pa':
        return 'pa-IN';
      case 'gu':
        return 'gu-IN';
      case 'mr':
        return 'mr-IN';
      case 'or':
        return 'or-IN';
      default:
        return 'en-IN';
    }
  };

  // 🎤 Toggle mic
  const handleToggleMic = () => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      alert('Microphone / speech recognition is not supported in this browser.');
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

  // 🔊 Speak text in selected language using best-matching voice
  const speakText = (text) => {
    if (!window.speechSynthesis) {
      alert('Speech output is not supported in this browser.');
      return;
    }

    const langCode = getVoiceLangCode(language);
    const availableVoices = voices.length ? voices : window.speechSynthesis.getVoices();

    // Try to find exact voice for lang (e.g. "te-IN")
    let voice =
      availableVoices.find((v) => v.lang === langCode) ||
      // or same language without region (e.g. "te")
      availableVoices.find((v) => v.lang.startsWith(langCode.split('-')[0])) ||
      availableVoices[0]; // fallback

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    if (voice) utterance.voice = voice;

    utterance.rate = 0.95;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // Load chat history
  const fetchChatHistory = async () => {
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
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  };

  // Load health tips
  const fetchHealthTips = async () => {
    try {
      const response = await aiService.getHealthTips('general', language);
      if (response.success) {
        setHealthTips(response.tips || []);
      }
    } catch (error) {
      console.error('Failed to fetch health tips:', error);
    }
  };

  // Send message
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

        // 🔊 Speak AI reply aloud in the selected language
        if (aiText) {
          speakText(aiText);
        }
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

  // Clear history
  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear chat history?')) {
      try {
        await aiService.clearChatHistory();
        setMessages([]);
        alert('Chat history cleared!');
      } catch (error) {
        console.error('Failed to clear history:', error);
        alert('Failed to clear history. Please try again.');
      }
    }
  };

  // Quick question
  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    setTimeout(() => {
      handleSendMessage({ preventDefault: () => {} });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          {t('chat.title')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Section */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg flex flex-col h-96 md:h-[500px]">
            {/* Language Selector */}
            <div className="border-b border-gray-200 p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Conversation Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Start a conversation with the AI health assistant!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <p className="text-sm flex-1 whitespace-pre-wrap">
                          {msg.text}
                        </p>
                        {msg.sender === 'ai' && (
                          <button
                            type="button"
                            onClick={() => speakText(msg.text)}
                            className="text-xs text-gray-600 hover:text-gray-900"
                            title={t('chat.listenReply') || 'Listen'}
                          >
                            🔊
                          </button>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === 'user'
                            ? 'text-blue-100'
                            : 'text-gray-600'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input + Mic Controls */}
            <div className="border-t border-gray-200 p-4">
              <form
                onSubmit={handleSendMessage}
                className="flex gap-2 items-center"
              >
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border text-sm mr-1 ${
                    isListening
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                  title={isListening ? 'Stop listening' : 'Tap to speak'}
                >
                  {isListening ? '⏹' : '🎤'}
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={t('chat.typeMessage')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                >
                  {t('chat.send')}
                </button>
              </form>

              <button
                onClick={handleClearHistory}
                className="mt-2 w-full bg-red-100 text-red-700 px-4 py-2 rounded text-sm hover:bg-red-200 transition"
              >
                {t('chat.clearHistory')}
              </button>
            </div>
          </div>

          {/* Sidebar - Health Tips */}
          <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              💡 {t('chat.healthTips')}
            </h3>

            <div className="space-y-3 mb-6">
              {healthTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="text-sm text-gray-700 p-2 bg-yellow-50 rounded"
                >
                  • {tip}
                </div>
              ))}
            </div>

            {/* Quick Questions */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3">
                Quick Questions
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() =>
                    handleQuickQuestion('How can I maintain a healthy lifestyle?')
                  }
                  className="w-full text-left text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 transition"
                >
                  Healthy Lifestyle Tips
                </button>
                <button
                  onClick={() =>
                    handleQuickQuestion('What are signs of good heart health?')
                  }
                  className="w-full text-left text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 transition"
                >
                  Heart Health
                </button>
                <button
                  onClick={() =>
                    handleQuickQuestion('How can I improve my sleep quality?')
                  }
                  className="w-full text-left text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 transition"
                >
                  Sleep Quality
                </button>
                <button
                  onClick={() =>
                    handleQuickQuestion('What are the benefits of exercise?')
                  }
                  className="w-full text-left text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 transition"
                >
                  Exercise Benefits
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
