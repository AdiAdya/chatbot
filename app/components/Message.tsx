import { Message as MessageType } from '../services/types';
import Image from 'next/image';

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
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-2">
                {attachment.kind === 'image' && attachment.dataUrl ? (
                  <div className="relative">
                    <Image
                      src={attachment.dataUrl}
                      alt={attachment.name}
                      width={192}
                      height={192}
                      className="max-w-48 max-h-48 rounded-lg object-cover"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {attachment.name}
                    </div>
                  </div>
                ) : attachment.kind === 'document' && attachment.textContent ? (
                  <div className="bg-gray-100 rounded-lg p-3 max-w-64">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">{attachment.name}</span>
                    </div>
                    <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                      {attachment.textContent.slice(0, 200)}
                      {attachment.textContent.length > 200 && '...'}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Message text */}
        <div 
          className="space-y-2"
          dangerouslySetInnerHTML={{ __html: message.text }} 
        />
      </div>
    </div>
  );
} 