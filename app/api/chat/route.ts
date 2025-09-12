import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { Message } from '@/app/services/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages, generateTitle } = await request.json();

    const formattedMessages: ChatCompletionMessageParam[] = (messages as Message[]).map((msg: Message) => {
      const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [{ type: 'text', text: msg.text }];
      if (msg.attachments && msg.attachments.length > 0) {
        for (const a of msg.attachments) {
          if (a.kind === 'image' && a.dataUrl) {
            parts.push({ type: 'image_url', image_url: { url: a.dataUrl } });
          } else if (a.kind === 'document' && a.textContent) {
            parts.push({ type: 'text', text: `Attached document (${a.name}):\n${a.textContent.slice(0, 4000)}` });
          }
        }
      }
      return { role: msg.isUser ? 'user' : 'assistant', content: parts } as ChatCompletionMessageParam;
    });

    formattedMessages.unshift({
      role: "system",
      content: "You are a helpful AI tutor. Provide clear, concise, and accurate responses. When answering follow-up questions, maintain context from previous messages."
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 400
    });

    const generatedText = completion.choices[0]?.message?.content;
    if (!generatedText) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      );
    }

    // Optionally generate a concise chat title for new chats
    let generatedTitle: string | undefined = undefined;
    if (generateTitle) {
      try {
        const titlePrompt: ChatCompletionMessageParam[] = [
          { role: 'system', content: 'Generate a concise, 3-7 word title summarizing the user\'s study question. Respond with title only, no quotes.' },
          { role: 'user', content: (messages?.find((m: Message) => m.isUser)?.text || '').slice(0, 1000) }
        ];
        const titleCompletion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: titlePrompt,
          temperature: 0.5,
          max_tokens: 16
        });
        generatedTitle = titleCompletion.choices[0]?.message?.content?.trim();
      } catch {}
    }

    return NextResponse.json({ text: generatedText, title: generatedTitle });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 