import { useState, useEffect, useRef } from "react";
import { REACT_APP_GEMINI_API_KEY } from "./constant";

function App() {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Load saved history
  useEffect(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAnswers(parsed);
    }
  }, []);

  // Save history
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(answers));
  }, [answers]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    scrollToBottom();
  }, [answers, loading]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const askQuestion = async () => {
    if (!question.trim() || loading) return;

    setLoading(true);
    
    // Add question immediately (at the bottom - new messages should appear at bottom)
    const newAnswer = {
      id: Date.now(),
      question,
      answer: ["Thinking..."],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    // Add new message at the END of array (so it shows at bottom)
    setAnswers(prev => [...prev, newAnswer]);

    try {
      const response = await fetch(
        REACT_APP_GEMINI_API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: question }] }]
          })
        }
      );

      const data = await response.json();
      
      if (data.candidates?.[0]) {
        const answerText = data.candidates[0].content.parts[0].text;
        const answerItems = answerText
          .split(/\*|\n/)
          .map(item => item.trim())
          .filter(item => item.length > 0);

        // Update the answer
        setAnswers(prev => prev.map(ans => 
          ans.id === newAnswer.id 
            ? { ...ans, answer: answerItems }
            : ans
        ));
      }
    } catch (error) {
      console.error("Error:", error);
      setAnswers(prev => prev.map(ans => 
        ans.id === newAnswer.id 
          ? { ...ans, answer: ["Sorry, something went wrong. Please try again."] }
          : ans
      ));
    } finally {
      setLoading(false);
      setQuestion("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const clearHistory = () => {
    if (window.confirm("Clear all chat history?")) {
      setAnswers([]);
      localStorage.removeItem('chatHistory');
    }
  };

  const deleteOne = (id) => {
    setAnswers(prev => prev.filter(answer => answer.id !== id));
  };

  const sampleQuestions = [
    "What is React?",
    "How to learn programming?",
    "Explain AI in simple terms",
    "Best way to stay productive"
  ];

  // Handle quick question click
  const handleQuickQuestion = (q) => {
    setQuestion(q);
    // Wait a tiny bit for state to update, then ask
    setTimeout(() => {
      askQuestion();
    }, 10);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
              AI
            </div>
            <h1 className="text-xl font-bold">AI Assistant</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              {showHistory ? "Hide History" : "Show History"}
            </button>
            {answers.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-3 py-1 text-red-500 hover:bg-red-50 rounded"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 flex gap-4">
        {/* Sidebar - History */}
        {showHistory && (
          <div className="w-64 flex-shrink-0 bg-white rounded-lg shadow p-4 h-[calc(100vh-100px)] overflow-auto">
            <h2 className="font-bold text-lg mb-4">Recent Chats</h2>
            
            {answers.length === 0 ? (
              <p className="text-gray-500 text-sm">No conversations yet</p>
            ) : (
              <div className="space-y-3">
                {[...answers].reverse().map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm line-clamp-2">{item.question}</p>
                      <button
                        onClick={() => deleteOne(item.id)}
                        className="text-gray-400 hover:text-red-500 text-sm"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Quick Questions */}
            <div className="mt-6">
              <h3 className="font-bold mb-3">Try asking:</h3>
              <div className="space-y-2">
                {sampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Chat */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow h-[calc(100vh-100px)]">
          {/* Messages Container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-auto p-4"
          >
            {answers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Hello! I'm AI Assistant</h2>
                <p className="text-gray-600 mb-6">Ask me anything and I'll help you out!</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md">
                  {sampleQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(q)}
                      className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                    >
                      <div className="font-medium">{q}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {answers.map((item) => (
                  <div key={item.id} className="space-y-3">
                    {/* Question - User message */}
                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xl">
                        <p className="font-medium">{item.question}</p>
                        <p className="text-xs opacity-80 mt-1">{item.time}</p>
                      </div>
                    </div>
                    
                    {/* Answer - AI message */}
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg max-w-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                            AI
                          </div>
                          <span className="font-medium">Assistant</span>
                        </div>
                        
                        {item.answer.map((line, index) => (
                          <p key={index} className="mb-2 last:mb-0">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                          AI
                        </div>
                        <span className="font-medium">Assistant</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Invisible element for auto-scroll */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area - FIXED: Now properly connected */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your question here..."
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-blue-500"
                disabled={loading}
              />
              <button
                onClick={askQuestion}
                disabled={loading || !question.trim()}
                className={`px-6 rounded-lg font-medium ${
                  loading || !question.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
              <p>Press Enter to send</p>
              {answers.length > 0 && (
                <p>{answers.length} message{answers.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;