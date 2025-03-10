import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { Message } from '@/app/services/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const formattedMessages: ChatCompletionMessageParam[] = messages.map((msg: Message) => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.text
    }));

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

    return NextResponse.json({ text: generatedText });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 