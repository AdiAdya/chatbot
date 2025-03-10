import { useRef } from 'react';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  hasReachedLimit: boolean;
  placeholder?: string;
}

export default function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
  hasReachedLimit,
  placeholder = "What can I help you with today?"
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="relative max-w-4xl mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={hasReachedLimit ? "Please upgrade to continue chatting" : placeholder}
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
  );
} 