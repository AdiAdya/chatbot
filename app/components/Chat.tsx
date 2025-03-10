'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Message from './Message';
import ChatInput from './ChatInput';
import ChatHistory from './ChatHistory';
import UserProfile from './UserProfile';
import LoadingIndicator from './LoadingIndicator';
import { 
  Message as MessageType, 
  ChatHistoryItem, 
  sendMessage,
  saveChatHistory,
  loadChatHistory,
  saveMessageCount,
  loadMessageCount,
  clearStorage
} from '../services/chatService';

export default function Chat() {
  const { data: session } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [selectedChatIndex, setSelectedChatIndex] = useState<number | null>(null);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [queryCount, setQueryCount] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const MESSAGE_LIMIT = 5;
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat history and query count from localStorage on component mount
  useEffect(() => {
    const savedHistory = loadChatHistory();
    const savedQueryCount = loadMessageCount();
    
    if (savedHistory) {
      setChatHistory(savedHistory);
    }

    if (savedQueryCount) {
      setQueryCount(savedQueryCount);
      if (!session && savedQueryCount >= MESSAGE_LIMIT) {
        setHasReachedLimit(true);
      }
    }
  }, [session]);

  // Save query count to localStorage whenever it changes
  useEffect(() => {
    saveMessageCount(queryCount);
  }, [queryCount]);

  // Update hasReachedLimit when session changes or query count updates
  useEffect(() => {
    if (session) {
      setHasReachedLimit(false);
      // Load chat history from localStorage when signing in
      const savedHistory = loadChatHistory();
      if (savedHistory) {
        try {
          setChatHistory(savedHistory);
          
          // If there's a selected chat, load its messages
          if (selectedChatIndex !== null && savedHistory[selectedChatIndex]) {
            const selectedChat = savedHistory[selectedChatIndex];
            const threadMessages: MessageType[] = selectedChat.messages.flatMap(msg => [
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
    saveChatHistory(chatHistory);
  }, [chatHistory]);

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

    const userMessage: MessageType = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage([...messages, userMessage]);
      const aiMessage: MessageType = { text: response, isUser: false };
      setMessages(prev => [...prev, aiMessage]);
      setQueryCount(prev => prev + 1);

      // Update chat history
      setChatHistory(prev => {
        const newMessage = {
          question: input,
          answer: response,
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
    const threadMessages: MessageType[] = item.messages.flatMap(msg => [
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
    clearStorage();
    setQueryCount(0);
    setHasReachedLimit(false);
    setChatHistory([]);
    setMessages([]);
    setSelectedChatIndex(null);
    await signOut();
  };

  return (
    <div className="flex h-screen relative bg-gray-50 p-4">
      <div className="flex flex-col gap-4">
        <UserProfile session={session} onSignOut={handleSignOut} />
        <ChatHistory
          history={chatHistory}
          selectedIndex={selectedChatIndex}
          onSelect={handleHistoryClick}
          onNewChat={clearChat}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </div>

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

              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                hasReachedLimit={hasReachedLimit}
              />
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
                  <Message key={index} message={message} />
                ))}
                {isLoading && <LoadingIndicator />}
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
            <ChatInput
              input={input}
              setInput={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              hasReachedLimit={hasReachedLimit}
            />
          </div>
        )}
      </div>
    </div>
  );
} 