import { HfInference } from '@huggingface/inference';
import { NextResponse } from 'next/server';

interface Message {
  text: string;
  isUser: boolean;
}

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('Received messages:', messages);
    
    // Prepare the conversation history
    const conversation = messages
      .map((msg: Message) => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');
    
    console.log('Prepared prompt:', conversation);

    const response = await hf.textGeneration({
      model: 'google/flan-t5-base',  // Using a smaller, more reliable model
      inputs: conversation,
      parameters: {
        max_new_tokens: 150,
        temperature: 0.7,
        top_k: 50,
        num_return_sequences: 1,
      },
    });

    console.log('API Response:', response);

    if (!response.generated_text) {
      throw new Error('No response generated');
    }

    return NextResponse.json({ 
      text: response.generated_text.trim()
    });
  } catch (error) {
    console.error('Detailed Hugging Face API error:', error);
    return NextResponse.json(
      { error: 'There was an error processing your request: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 