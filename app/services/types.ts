export interface Attachment {
  kind: 'image' | 'document';
  name: string;
  dataUrl?: string; // For images
  textContent?: string; // For documents
  size?: number;
}

export interface Message {
  text: string;
  isUser: boolean;
  attachments?: Attachment[];
} 