import { useEffect, useRef, useState } from 'react';
import { Attachment } from '../services/types';
import { processFile, formatFileSize } from '../utils/fileUtils';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  hasReachedLimit: boolean;
  placeholder?: string;
  isPremium?: boolean;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
}

export default function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
  hasReachedLimit,
  placeholder = "What can I help you with today?",
  isPremium = false,
  attachments = [],
  onAttachmentsChange
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition settings for better Opera compatibility
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [setInput]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFile(true);
    try {
      const newAttachments: Attachment[] = [];
      for (const file of Array.from(files)) {
        const attachment = await processFile(file);
        newAttachments.push(attachment);
      }
      onAttachmentsChange?.([...attachments, ...newAttachments]);
    } catch (error) {
      console.error('Error processing file:', error);
      alert(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsProcessingFile(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange?.(newAttachments);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Focus the input on mount and whenever it becomes enabled
  useEffect(() => {
    if (!isLoading && !hasReachedLimit) {
      inputRef.current?.focus();
    }
  }, [isLoading, hasReachedLimit]);

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.txt,.pdf,.md"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading || hasReachedLimit || isProcessingFile}
      />

      {/* Attachments display */}
      {attachments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                {attachment.kind === 'image' ? (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-gray-700">{attachment.name}</span>
                {attachment.size && (
                  <span className="text-gray-500">({formatFileSize(attachment.size)})</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                disabled={isLoading || hasReachedLimit}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="w-full">
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasReachedLimit ? (isPremium ? "Premium users have unlimited access" : "Sign up to unlock unlimited AI chat") : placeholder}
            className="w-full px-6 py-4 rounded-full border border-gray-200 focus:outline-none focus:border-[#0a1172] pr-32 text-[#0a1172] placeholder-gray-400 shadow-sm"
            disabled={isLoading || hasReachedLimit || isProcessingFile}
          />
          
          {/* File Upload Button */}
          <button
            type="button"
            onClick={openFileDialog}
            className={`absolute right-20 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${
              isProcessingFile
                ? 'text-gray-400'
                : 'text-gray-500 hover:text-[#0a1172] hover:bg-gray-100'
            }`}
            disabled={isLoading || hasReachedLimit || isProcessingFile}
            title="Attach file"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49" />
            </svg>
          </button>
          
          {/* Microphone Button */}
          {isSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`absolute right-14 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-gray-500 hover:text-[#0a1172] hover:bg-gray-100'
              }`}
              disabled={isLoading || hasReachedLimit || isProcessingFile}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
          
          {/* Send Button */}
          <button
            type="submit"
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 ${
              isLoading || isProcessingFile ? 'text-gray-400' : 'text-[#0a1172] hover:text-[#0a1172]/80'
            }`}
            disabled={isLoading || hasReachedLimit || isProcessingFile}
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
        
        {/* Sign Up to Unlock button when limit is reached */}
        {hasReachedLimit && !isPremium && (
          <div className="mt-4 text-center">
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-200 shadow-md">
              Sign Up to Unlock
            </button>
          </div>
        )}
      </form>
    </div>
  );
} 