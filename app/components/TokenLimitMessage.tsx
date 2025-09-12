import React from 'react';

interface TokenLimitMessageProps {
  isPremium?: boolean;
  messageCount?: number;
  maxMessages?: number;
  stripeStatus?: string;
}

export default function TokenLimitMessage({ 
  isPremium = false, 
  messageCount = 20, 
  maxMessages = 20,
  stripeStatus = 'FREE'
}: TokenLimitMessageProps) {
  if (isPremium) {
    return null; // Don't show limit message for premium users
  }

  const getStatusMessage = () => {
    switch (stripeStatus) {
      case 'CANCELLED':
        return 'Your subscription has been cancelled. Reactivate to continue with unlimited AI chat.';
      case 'NOT_PAID':
        return 'Payment is required to continue with unlimited AI chat.';
      case 'FREE':
      default:
        return 'Upgrade to Premium for unlimited AI chat and get answers to all your study questions.';
    }
  };

  return (
    <div className="bg-white border-4 border-orange-400 rounded-3xl p-8 mx-4 mb-6 shadow-lg">
      <div className="text-center">
        {/* Main message with larger, bolder text */}
        <h2 className="text-3xl font-bold text-blue-900 mb-4">
          You've reached {maxMessages}-message limit!
        </h2>
        
        {/* Subtitle with better spacing */}
        <p className="text-blue-900 mb-8 text-lg leading-relaxed">
          {getStatusMessage()} 🚀
        </p>
        
        {/* Upgrade Button - matching the design with thicker border styling */}
        <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-12 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg">
          {stripeStatus === 'CANCELLED' ? 'Reactivate Subscription' : 'Upgrade to Premium'}
        </button>
        
        {/* Additional info */}
        <p className="text-sm text-gray-500 mt-4">
          Join thousands of students already using TutorChase Premium
        </p>
      </div>
    </div>
  );
}
