// Test file to verify microphone functionality
// This file can be used to test the speech recognition API

// Test function to check if speech recognition is supported
function testSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    console.log('✅ Speech Recognition is supported');
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('📝 Transcript:', transcript);
    };
    
    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
    };
    
    recognition.onend = () => {
      console.log('🛑 Speech recognition ended');
    };
    
    return recognition;
  } else {
    console.log('❌ Speech Recognition is not supported');
    return null;
  }
}

// Export for testing
if (typeof window !== 'undefined') {
  window.testSpeechRecognition = testSpeechRecognition;
}
