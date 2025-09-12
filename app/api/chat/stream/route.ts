import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { Message } from '@/app/services/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const { messages } = await request.json();

  const formatted: ChatCompletionMessageParam[] = [
    { role: 'system', content: 'You are a helpful AI tutor.' },
    ...(messages as Message[]).map((m: Message) => {
      const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [{ type: 'text', text: m.text }];
      if (m.attachments && m.attachments.length > 0) {
        for (const a of m.attachments) {
          if (a.kind === 'image' && a.dataUrl) {
            parts.push({ type: 'image_url', image_url: { url: a.dataUrl } });
          } else if (a.kind === 'document' && a.textContent) {
            parts.push({ type: 'text', text: `Attached document (${a.name}):\n${a.textContent.slice(0, 4000)}` });
          }
        }
      }
      return { role: m.isUser ? 'user' : 'assistant', content: parts } as ChatCompletionMessageParam;
    }),
  ];

  const headers = new Headers();
  headers.set('Content-Type', 'text/event-stream; charset=utf-8');
  headers.set('Cache-Control', 'no-cache');
  headers.set('Connection', 'keep-alive');
  headers.set('X-Accel-Buffering', 'no');

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: formatted,
          temperature: 0.7,
          max_tokens: 400,
          stream: true,
        });
        for await (const part of completion) {
          const delta = (part as { choices?: Array<{ delta?: { content?: string } }> })?.choices?.[0]?.delta?.content || '';
          if (delta) send({ delta });
        }
        controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
      } catch (e: unknown) {
        send({ error: 'stream_error', message: String(e instanceof Error ? e.message : e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}


