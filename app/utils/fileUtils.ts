import { Attachment } from '../services/types';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['text/plain', 'application/pdf', 'text/markdown'];

export function isImageFile(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}

export function isDocumentFile(file: File): boolean {
  return ALLOWED_DOCUMENT_TYPES.includes(file.type);
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (!isImageFile(file) && !isDocumentFile(file)) {
    return { 
      valid: false, 
      error: 'Only images (JPEG, PNG, GIF, WebP) and documents (TXT, PDF, MD) are allowed' 
    };
  }

  return { valid: true };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function processFile(file: File): Promise<Attachment> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const attachment: Attachment = {
    kind: isImageFile(file) ? 'image' : 'document',
    name: file.name,
    size: file.size,
  };

  if (attachment.kind === 'image') {
    attachment.dataUrl = await fileToDataUrl(file);
  } else {
    attachment.textContent = await fileToText(file);
  }

  return attachment;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
