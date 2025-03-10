import { Message as MessageType } from '../services/chatService';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
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
  );
} 