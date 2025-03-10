import { Message } from './types';

export interface ChatHistoryItem {
  id: string;
  title: string;
  messages: {
    question: string;
    answer: string;
    timestamp: Date;
  }[];
  timestamp: Date;
}

export const STORAGE_KEYS = {
  CHAT_HISTORY: 'chat_history',
  MESSAGE_COUNT: 'message_count'
} as const;

export function formatResponse(text: string): string {
  const formattedText = text
    .replace(/<br\/>/g, '\n')
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    .trim();

  return formattedText
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\n/g, '<br/>')
    .replace(/•\s+/g, '• ')
    .replace(/(<br\/>){3,}/g, '<br/><br/>');
}

export async function sendMessage(messages: Message[]): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get response');
  }

  const data = await response.json();
  if (!data.text) {
    throw new Error('No response received from the AI');
  }

  return formatResponse(data.text);
}

export function saveChatHistory(history: ChatHistoryItem[]): void {
  if (history.length > 0) {
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));
  }
}

export function loadChatHistory(): ChatHistoryItem[] {
  const savedHistory = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
  if (!savedHistory) return [];

  return JSON.parse(savedHistory).map((item: Omit<ChatHistoryItem, 'timestamp'> & { 
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
}

export function saveMessageCount(count: number): void {
  localStorage.setItem(STORAGE_KEYS.MESSAGE_COUNT, count.toString());
}

export function loadMessageCount(): number {
  const savedCount = localStorage.getItem(STORAGE_KEYS.MESSAGE_COUNT);
  return savedCount ? parseInt(savedCount) : 0;
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
  localStorage.removeItem(STORAGE_KEYS.MESSAGE_COUNT);
} 