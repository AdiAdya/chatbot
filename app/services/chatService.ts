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
  let normalized = text
    .replace(/<br\/>/g, '\n')
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    .trim();

  const tables: string[] = [];
  const tableBlockRegex = /(\n|^)\s*\|.*\|\s*\n\s*\|(?:\s*:?-+:?\s*\|)+\s*\n(?:\s*\|.*\|\s*\n?)*/gim;
  normalized = normalized.replace(tableBlockRegex, (block) => {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return block;
    const headerCells = lines[0].replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const bodyLines = lines.slice(2).filter((l) => /^\|.*\|$/.test(l));
    const rows = bodyLines.map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
    const borderStyle = 'border:1px solid #e5e7eb;padding:6px;text-align:left;';
    let html = '<table style="border-collapse:collapse;width:100%">\n<thead><tr>';
    headerCells.forEach((h) => { html += `<th style="${borderStyle}">${h}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach((r) => { html += '<tr>' + r.map((c) => `<td style="${borderStyle}vertical-align:top;">${c}</td>`).join('') + '</tr>'; });
    html += '</tbody></table>';
    const key = `__TABLE_${tables.length}__`;
    tables.push(html);
    return key + '\n';
  });

  // Convert simple LaTeX-style inline markers to readable text
  normalized = normalized
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\[/g, '(')
    .replace(/\\\]/g, ')')
    .replace(/\\theta/g, 'θ')
    .replace(/\\pi/g, 'π')
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\\\/g, '\\')
    .replace(/\\([a-zA-Z])/g, '$1');

  let html = normalized
    .replace(/^######\s?(.*)$/gim, '<h6>$1</h6>')
    .replace(/^#####\s?(.*)$/gim, '<h5>$1</h5>')
    .replace(/^####\s?(.*)$/gim, '<h4>$1</h4>')
    .replace(/^###\s?(.*)$/gim, '<h3>$1</h3>')
    .replace(/^##\s?(.*)$/gim, '<h2>$1</h2>')
    .replace(/^#\s?(.*)$/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/•\s+/g, '• ')
    .replace(/\n/g, '<br/>')
    .replace(/(<br\/>){3,}/g, '<br/><br/>' );

  tables.forEach((t, i) => {
    html = html.replace(`__TABLE_${i}__`, t);
  });

  return html;
}

export async function sendMessage(messages: Message[]): Promise<{ text: string; title?: string }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, generateTitle: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get response');
  }

  const data = await response.json();
  if (!data.text) {
    throw new Error('No response received from the AI');
  }

  return { text: formatResponse(data.text), title: data.title };
}

export async function streamMessage(
  messages: Message[],
  onDelta?: (chunk: string) => void,
): Promise<void> {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!response.ok || !response.body) throw new Error('Streaming failed');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
    for (const p of parts) {
      if (p.startsWith('data:')) {
        try {
          const json = JSON.parse(p.replace(/^data:\s*/, '')) as { delta?: string };
          if (json.delta && onDelta) onDelta(json.delta);
        } catch {}
      }
    }
  }
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