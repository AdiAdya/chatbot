import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Call TutorChase API to get user subscription status
    const tutorChaseApiUrl = process.env.TUTORCHASE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${tutorChaseApiUrl}/api/users/subscription-status?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If user doesn't exist or API is down, treat as FREE
      return NextResponse.json({ 
        stripeStatus: 'FREE',
        isPremium: false 
      });
    }

    const userData = await response.json();
    
    // TRIAL and PAID users get premium features
    const isPremium = userData.stripeStatus === 'TRIAL' || userData.stripeStatus === 'PAID';
    
    return NextResponse.json({
      stripeStatus: userData.stripeStatus,
      isPremium: isPremium
    });

  } catch (error) {
    console.error('Error checking subscription status:', error);
    // Default to FREE if there's an error
    return NextResponse.json({ 
      stripeStatus: 'FREE',
      isPremium: false 
    });
  }
}
