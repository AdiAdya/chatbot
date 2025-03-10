'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Message {
  text: string;
  isUser: boolean;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  messages: {
    question: string;
    answer: string;
    timestamp: Date;
  }[];
  timestamp: Date;
}

const STORAGE_KEYS = {
  CHAT_HISTORY: 'chat_history',
  MESSAGE_COUNT: 'message_count'
} as const;

export default function Chat() {
  const { data: session } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [selectedChatIndex, setSelectedChatIndex] = useState<number | null>(null);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [queryCount, setQueryCount] = useState(0);
  const MESSAGE_LIMIT = 5;
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showHeader, setShowHeader] = useState(true);

  // Load chat history and query count from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    const savedQueryCount = localStorage.getItem(STORAGE_KEYS.MESSAGE_COUNT);
    
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory).map((item: Omit<ChatHistoryItem, 'timestamp'> & { 
        timestamp: string;
        messages: Array<{
          question: string;
          answer: string;
          timestamp: string;
        }>;
      }) => ({
        ...item,
        timestamp: new Date(item.timestamp),
        messages: item.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setChatHistory(parsedHistory);
    }

    if (savedQueryCount) {
      setQueryCount(parseInt(savedQueryCount));
      if (!session && parseInt(savedQueryCount) >= MESSAGE_LIMIT) {
        setHasReachedLimit(true);
      }
    }
  }, [session]);

  // Save query count to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGE_COUNT, queryCount.toString());
  }, [queryCount]);

  // Update hasReachedLimit when session changes or query count updates
  useEffect(() => {
    if (session) {
      setHasReachedLimit(false);
      // Load chat history from localStorage when signing in
      const savedHistory = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory).map((item: Omit<ChatHistoryItem, 'timestamp'> & { 
            timestamp: string;
            messages: Array<{
              question: string;
              answer: string;
              timestamp: string;
            }>;
          }) => ({
            ...item,
            timestamp: new Date(item.timestamp),
            messages: item.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          setChatHistory(parsedHistory);
          
          // If there's a selected chat, load its messages
          if (selectedChatIndex !== null && parsedHistory[selectedChatIndex]) {
            const selectedChat = parsedHistory[selectedChatIndex];
            const threadMessages: Message[] = selectedChat.messages.flatMap((msg: { question: string; answer: string; timestamp: Date }) => [
              { text: msg.question, isUser: true },
              { text: msg.answer, isUser: false }
            ]);
            setMessages(threadMessages);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      }
    } else {
      setHasReachedLimit(queryCount >= MESSAGE_LIMIT);
    }
  }, [session, queryCount, MESSAGE_LIMIT, selectedChatIndex]);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  // Focus input after loading completes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Update showHeader when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setShowHeader(false);
    } else {
      setShowHeader(true);
    }
  }, [messages]);

  // Add scroll to bottom effect
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check query limit for non-authenticated users
    if (!session && queryCount >= MESSAGE_LIMIT) {
      setHasReachedLimit(true);
      return;
    }

    const userMessage: Message = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      if (!data.text) {
        throw new Error('No response received from the AI');
      }

      const aiMessage: Message = {
        text: data.text,
        isUser: false,
      };

      setMessages(prev => [...prev, aiMessage]);
      setQueryCount(prev => prev + 1);

      // Update chat history
      setChatHistory(prev => {
        const newMessage = {
          question: input,
          answer: data.text,
          timestamp: new Date()
        };

        let updatedHistory;
        // If there's no chat history, create first thread
        if (prev.length === 0) {
          updatedHistory = [{
            id: Math.random().toString(36).substring(7),
            title: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
            messages: [newMessage],
            timestamp: new Date()
          }];
        }
        // If we're starting fresh (selectedChatIndex is null), add to the last thread
        else if (selectedChatIndex === null) {
          updatedHistory = prev.map((chat, index) => 
            index === prev.length - 1 ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              title: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
              timestamp: new Date()
            } : chat
          );
        }
        // Add to existing thread
        else {
          const currentChat = prev[selectedChatIndex];
          if (!currentChat) {
            // If selected chat doesn't exist, add to the last thread
            updatedHistory = prev.map((chat, index) => 
              index === prev.length - 1 ? {
                ...chat,
                messages: [...chat.messages, newMessage],
                title: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
                timestamp: new Date()
              } : chat
            );
          } else {
            // Update the existing thread
            updatedHistory = prev.map((chat, index) => 
              index === selectedChatIndex ? {
                ...chat,
                messages: [...chat.messages, newMessage],
                title: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
                timestamp: new Date()
              } : chat
            );
          }
        }

        return updatedHistory;
      });

      // Set the index of the current chat as selected
      setSelectedChatIndex(chatHistory.length);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryClick = (item: ChatHistoryItem, index: number) => {
    setSelectedChatIndex(index);
    // Load all messages from the selected thread
    const threadMessages: Message[] = item.messages.flatMap(msg => [
      { text: msg.question, isUser: true },
      { text: msg.answer, isUser: false }
    ]);
    setMessages(threadMessages);
    
    // Check if we've reached the limit based on the global query count
    if (!session && queryCount >= MESSAGE_LIMIT) {
      setHasReachedLimit(true);
    } else {
      setHasReachedLimit(false);
    }
    
    // Close sidebar on mobile when chat is selected
    setIsSidebarOpen(false);
    // Focus input after clicking history item
    inputRef.current?.focus();
  };

  const clearChat = () => {
    if (!session && queryCount >= MESSAGE_LIMIT) return;
    
    setMessages([]);
    setInput('');
    setSelectedChatIndex(null);
    // Create a new thread when starting a new chat
    setChatHistory(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      title: "New Chat",
      messages: [],
      timestamp: new Date()
    }]);
  };

  const handleSignOut = async () => {
    // Clear both message count and chat history from localStorage
    localStorage.removeItem(STORAGE_KEYS.MESSAGE_COUNT);
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    setQueryCount(0);
    setHasReachedLimit(false);
    setChatHistory([]);
    setMessages([]);
    setSelectedChatIndex(null);
    await signOut();
  };

  return (
    <div className="flex h-screen relative bg-gray-50 p-4">
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-[#0a1172]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      {/* Query History Sidebar */}
      <div 
        className={`
          fixed lg:relative w-80 h-full
          transition-transform duration-300 ease-in-out z-40 flex flex-col
          mr-4 p-4 gap-4
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* User Profile Section */}
        <div>
          {session ? (
            <div className="flex items-center justify-between bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {session.user?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-[#0a1172] text-white rounded-full py-3 px-4 hover:bg-[#0a1172]/90 transition-colors shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Scrollable Chat History */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-4 space-y-3">
              {chatHistory.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  You will see recent chats here
                </div>
              ) : (
                chatHistory.map((item, index) => {
                  const isSelected = index === selectedChatIndex;
                  return (
                    <div
                      key={index}
                      onClick={() => handleHistoryClick(item, index)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all flex justify-between items-center ${
                        isSelected 
                          ? 'bg-[#0a1172] shadow-md'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className={`text-[15px] font-medium line-clamp-2 flex-1 ${
                        isSelected ? 'text-white' : 'text-[#1a1a1a]'
                      }`}>
                        {item.title}
                      </div>
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-6 h-6 ml-2 flex-shrink-0 text-white"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div>
          <button
            onClick={clearChat}
            className="w-full bg-[#0a1172] text-white rounded-full py-3 px-4 flex items-center justify-center gap-2 hover:bg-[#0a1172]/90 transition-colors shadow-sm"
          >
            <span>Start a New Chat</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl overflow-hidden">
        {showHeader && (
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-12">
              <div className="text-center max-w-3xl mx-auto px-4">
                <div className="inline-flex items-center gap-2 mb-6">
                  <span className="text-sm bg-gray-50 text-[#0a1172] px-6 py-2 rounded-full font-medium">
                    Trusted by 100,000+ Students
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-[#0a1172]">
                  Your <span className="relative">
                    Personal AI Tutor
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-orange-400 -mb-1"></span>
                  </span>, Available 24/7
                </h1>
              </div>

              <form onSubmit={handleSubmit} className="w-full max-w-2xl px-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={hasReachedLimit ? "Please upgrade to continue chatting" : "What can I help you with today?"}
                    className="w-full px-6 py-4 rounded-full border border-gray-200 focus:outline-none focus:border-[#0a1172] pr-12 text-[#0a1172] placeholder-gray-400 shadow-sm"
                    disabled={isLoading || hasReachedLimit}
                  />
                  <button
                    type="submit"
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 ${
                      isLoading ? 'text-gray-400' : 'text-[#0a1172] hover:text-[#0a1172]/80'
                    }`}
                    disabled={isLoading || hasReachedLimit}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div 
          ref={chatContainerRef}
          className={`
            ${showHeader ? 'hidden' : 'flex-1 flex flex-col bg-white rounded-3xl overflow-hidden'}
          `}
        >
          <div className="flex-1 overflow-auto p-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-4">
                {error}
              </div>
            )}
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Ask me anything!
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-8 py-4 ${
                        message.isUser
                          ? 'bg-[#0a1172] text-white'
                          : 'bg-white border border-gray-200 text-[#0a1172]'
                      }`}
                    >
                      <div 
                        className="space-y-2"
                        dangerouslySetInnerHTML={{ __html: message.text }} 
                      />
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-6 py-3 bg-white border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#0a1172] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-[#0a1172] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-[#0a1172] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {hasReachedLimit && !session && (
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="max-w-4xl mx-auto">
                <div className="rounded-2xl border border-orange-200 p-6 bg-orange-50">
                  <h2 className="text-xl font-bold text-center text-[#1a237e] mb-2">
                    You&apos;ve reached {MESSAGE_LIMIT}-message limit!
                  </h2>
                  <p className="text-center text-gray-700 mb-4">
                    Sign in for unlimited AI chat and get answers to all your study questions. 🚀
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => router.push('/login')}
                      className="bg-[#ff4d00] text-white font-medium px-6 py-2 rounded-full hover:bg-[#ff4d00]/90 transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {!showHeader && (
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative max-w-4xl mx-auto">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={hasReachedLimit ? "Please upgrade to continue chatting" : "What can I help you with today?"}
                  className="w-full px-6 py-4 rounded-full border border-gray-200 focus:outline-none focus:border-[#0a1172] pr-12 text-[#0a1172] placeholder-gray-400 shadow-sm"
                  disabled={isLoading || hasReachedLimit}
                />
                <button
                  type="submit"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 ${
                    isLoading ? 'text-gray-400' : 'text-[#0a1172] hover:text-[#0a1172]/80'
                  }`}
                  disabled={isLoading || hasReachedLimit}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 