import { ChatHistoryItem } from '../services/chatService';

interface ChatHistoryProps {
  history: ChatHistoryItem[];
  selectedIndex: number | null;
  onSelect: (item: ChatHistoryItem, index: number) => void;
  onNewChat: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  hasReachedLimit: boolean;
}

export default function ChatHistory({
  history,
  selectedIndex,
  onSelect,
  onNewChat,
  isSidebarOpen,
  setIsSidebarOpen,
  hasReachedLimit
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
          fixed lg:relative w-80 max-h-screen overflow-hidden
          transition-transform duration-300 ease-in-out z-40 flex flex-col
          mr-4 p-4 gap-4
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Scrollable Chat History */}
        <div className="flex-1 min-h-0 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
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
                      <div className={`text-[15px] font-medium line-clamp-2 ${
                        isSelected ? 'text-white' : 'text-[#1a1a1a]'
                      }`}>
                        {item.title}
                      </div>
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
            disabled={hasReachedLimit}
            className={`w-full rounded-full py-3 px-4 flex items-center justify-center gap-2 transition-colors shadow-sm ${
              hasReachedLimit 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#0a1172] text-white hover:bg-[#0a1172]/90'
            }`}
          >
            <span>Start a New Chat</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
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