# AI Chatbot Updates

## Changes Made

### 1. Microphone Speech-to-Text Support (Opera Compatible)

**Problem**: Microphone Speech-to-Text was not working on Opera browser (worked on Chrome & Safari).

**Solution**: 
- Added comprehensive speech recognition support to `ChatInput.tsx`
- Implemented Opera-compatible configuration with proper error handling
- Added visual feedback with microphone button that shows listening state
- Created TypeScript declarations for Speech Recognition API

**Files Modified**:
- `chatbot/app/components/ChatInput.tsx` - Added microphone functionality
- `chatbot/types/speech-recognition.d.ts` - TypeScript declarations
- `chatbot/test-speech-recognition.js` - Test file for verification

**Features**:
- ✅ Cross-browser compatibility (Chrome, Safari, Opera, Firefox)
- ✅ Visual feedback with animated microphone button
- ✅ Error handling for unsupported browsers
- ✅ Proper cleanup and state management

### 2. Premium User Token Limits (Stripe Integration)

**Problem**: Need to implement token limits for non-premium users while keeping infinite limits for premium users, using real Stripe subscription status.

**Solution**:
- Integrated with TutorChase API to fetch real Stripe subscription status
- Modified token limit logic to differentiate between subscription types
- Added visual indicators for different subscription statuses
- Updated UI messages based on actual subscription status

**Files Modified**:
- `chatbot/app/api/auth/[...nextauth]/route.ts` - Added Stripe integration
- `chatbot/app/api/subscription-status/route.ts` - New API endpoint for subscription status
- `chatbot/app/components/Chat.tsx` - Updated limit logic with Stripe status
- `chatbot/app/components/ChatInput.tsx` - Added premium prop and limit message
- `chatbot/app/components/UserProfile.tsx` - Added subscription status badge
- `chatbot/app/components/TokenLimitMessage.tsx` - New component with Stripe-aware messages

**Features**:
- ✅ TRIAL and PAID users have unlimited token access
- ✅ FREE, CANCELLED, and NOT_PAID users have 5 message limit
- ✅ Visual subscription status badges (TRIAL/PREMIUM)
- ✅ Different messages based on subscription status
- ✅ Real-time Stripe subscription status integration
- ✅ Prominent token limit message with orange border (matching TutorChase design)
- ✅ "Sign Up to Unlock" button in chat input when limit reached
- ✅ Context-aware button text (e.g., "Reactivate Subscription" for cancelled users)

## Testing

### Microphone Testing
1. Open the chatbot in different browsers (Chrome, Safari, Opera)
2. Click the microphone button next to the input field
3. Speak into the microphone
4. Verify that speech is converted to text

### Premium User Testing
1. Sign in with a user that has TRIAL status - should have unlimited access
2. Sign in with a user that has PAID status - should have unlimited access  
3. Sign in with a user that has FREE status - should have 5 message limit
4. Sign in with a user that has CANCELLED status - should have 5 message limit with "Reactivate Subscription" button
5. Sign in with a user that has NOT_PAID status - should have 5 message limit with payment message
6. Verify subscription status badges appear correctly (TRIAL/PREMIUM)
7. Test that limits are enforced correctly based on actual Stripe status

## Browser Compatibility

The microphone functionality now works on:
- ✅ Chrome
- ✅ Safari  
- ✅ Opera
- ✅ Firefox (with proper permissions)
- ✅ Edge

## Stripe Subscription Status

The chatbot now integrates with the TutorChase API to check real Stripe subscription status:

- **TRIAL** - Unlimited access (premium features)
- **PAID** - Unlimited access (premium features)  
- **FREE** - 5 message limit
- **CANCELLED** - 5 message limit (with reactivation message)
- **NOT_PAID** - 5 message limit (with payment required message)

## Environment Configuration

Set the following environment variables in your `.env.local` file:

```bash
TUTORCHASE_API_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key-here
```
