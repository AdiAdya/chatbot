import { useEffect, useRef } from 'react';

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

  // Focus the input on mount and whenever it becomes enabled
  useEffect(() => {
    if (!isLoading && !hasReachedLimit) {
      inputRef.current?.focus();
    }
  }, [isLoading, hasReachedLimit]);

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="relative w-full">
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
    </form>
  );
} 