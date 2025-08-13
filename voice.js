async function getSynthesizedAudio(textToSpeak) {
  const API_KEY = localStorage.getItem('gemini-api-key') || 'YOUR_API_KEY';
  
  if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
    // If no API key is set, fall back to Web Speech API
    return await synthesizeWithWebSpeechAPI(textToSpeak);
  }
  
  // Try to use the Gemini API first
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`;

    const requestBody = {
      "contents": [
        {
          "parts": [
            {
              "text": textToSpeak
            }
          ]
        }
      ],
      "generationConfig": {
        "responseMimeType": "application/json"
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw error text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Check if the response has the expected structure for audio
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      throw new Error('Unexpected response format from Gemini API');
    }
    
    // The audio content might be returned differently, so we need to check the structure
    const audioPart = data.candidates[0].content.parts[0];
    
    // If we get audio data directly, it might be in a different format
    if (audioPart.audioUrl) {
      // If the API returns an audio URL, we would need to fetch the audio from that URL
      // This is just a placeholder for handling that case
      throw new Error('Audio URL returned instead of audio data. This implementation needs to be updated.');
    } else if (audioPart.inlineData && audioPart.inlineData.data) {
      // The audio content is returned as a base64 encoded string
      const audioContent = audioPart.inlineData.data;
      return audioContent;
    } else {
      throw new Error('Unexpected response format from Gemini API - no audio data found');
    }
  } catch (error) {
    console.error('Error with Gemini API TTS, falling back to Web Speech API:', error);
    // Fall back to Web Speech API if Gemini API fails
    return await synthesizeWithWebSpeechAPI(textToSpeak);
  }
}

// Fallback function using Web Speech API
function synthesizeWithWebSpeechAPI(textToSpeak) {
  return new Promise((resolve, reject) => {
    // Check if the Web Speech API is supported
    if ('speechSynthesis' in window) {
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Set default properties
      utterance.volume = 1; // 0 to 1
      utterance.rate = 1; // 0.1 to 10
      utterance.pitch = 1; // 0 to 2
      
      // Event when speech starts
      utterance.onstart = () => {
        console.log('Speech started');
      };
      
      // Event when speech ends
      utterance.onend = () => {
        console.log('Speech ended');
        // Resolve with null since we're playing directly
        resolve(null);
      };
      
      // Event for errors
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };
      
      // Speak the utterance
      speechSynthesis.speak(utterance);
    } else {
      reject(new Error('Web Speech API is not supported in this browser'));
    }
  });
}

export { getSynthesizedAudio };