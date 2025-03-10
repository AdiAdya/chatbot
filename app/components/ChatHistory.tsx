import { ChatHistoryItem } from '../services/chatService';

interface ChatHistoryProps {
  history: ChatHistoryItem[];
  selectedIndex: number | null;
  onSelect: (item: ChatHistoryItem, index: number) => void;
  onNewChat: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function ChatHistory({
  history,
  selectedIndex,
  onSelect,
  onNewChat,
  isSidebarOpen,
  setIsSidebarOpen
}: ChatHistoryProps) {
  return (
    <>
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
        {/* Scrollable Chat History */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-4 space-y-3">
              {history.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  You will see recent chats here
                </div>
              ) : (
                history.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={index}
                      onClick={() => onSelect(item, index)}
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
            onClick={onNewChat}
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
    </>
  );
} 