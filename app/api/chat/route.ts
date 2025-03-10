import { NextResponse } from 'next/server';

interface Message {
  text: string;
  isUser: boolean;
}

function formatResponse(text: string): string {
  // Convert HTML to markdown-style formatting
  const formattedText = text
    // Convert <br/> to actual newlines
    .replace(/<br\/>/g, '\n')
    // Convert <b> tags to markdown bold
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    // Trim any extra whitespace
    .trim();

  // Now convert back to our desired HTML format
  return formattedText
    // Convert markdown bold back to HTML bold
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    // Convert single newlines to <br/>
    .replace(/\n/g, '<br/>')
    // Ensure bullet points have consistent spacing
    .replace(/•\s+/g, '• ')
    // Clean up any multiple consecutive <br/> tags
    .replace(/(<br\/>){3,}/g, '<br/><br/>');
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json();
    console.log('Received messages:', messages);

    const lastMessage = messages[messages.length - 1];
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: lastMessage.text }]
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Full API error:', error);
      throw new Error(error.error?.message || 'Failed to generate response');
    }

    const data = await response.json();
    console.log('API Response:', data);

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('No response generated');
    }

    const formattedText = formatResponse(generatedText);

    return NextResponse.json({ 
      text: formattedText
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'There was an error processing your request: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 