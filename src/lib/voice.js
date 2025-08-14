// Using the new Gemini TTS model via direct API calls
// This provides better quality and more natural speech

async function getSynthesizedAudio(textToSpeak, voiceName = 'Kore') {
  const API_KEY = localStorage.getItem('gemini-api-key') || 'YOUR_API_KEY';
  
  if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
    // If no API key is set, show an error popup
    throw new Error('Please set your Google Cloud API key in the settings');
  }
  
  try {
    // Using the new Gemini TTS model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: textToSpeak }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`TTS API request failed: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const audioPart = data.candidates?.[0]?.content?.parts?.[0];
    
    if (!audioPart?.inlineData?.data) {
      throw new Error('No audio data received.');
    }
    
    // Log the MIME type for debugging
    console.log('Audio MIME type:', audioPart.inlineData.mimeType);
    
    // Return both the audio data and its MIME type
    return {
      data: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType
    };
  } catch (error) {
    console.error('Error with Google TTS:', error);
    throw error;
  }
}

// Function to control Web Speech API playback
function controlWebSpeechPlayback(action) {
  console.log('Control Web Speech Playback:', action);
  if ('speechSynthesis' in window) {
    console.log('Speech synthesis state:', {
      speaking: speechSynthesis.speaking,
      paused: speechSynthesis.paused
    });
    
    switch (action) {
      case 'pause':
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
          console.log('Pausing speech');
          speechSynthesis.pause();
          return true;
        }
        break;
      case 'resume':
        if (speechSynthesis.paused) {
          console.log('Resuming speech');
          speechSynthesis.resume();
          return true;
        }
        break;
      case 'stop':
        if (speechSynthesis.speaking) {
          console.log('Stopping speech');
          speechSynthesis.cancel();
          return true;
        }
        break;
    }
  }
  console.log('Control action not executed');
  return false;
}

// Function to convert PCM data to WAV format
function convertPcmToWav(pcmBase64, sampleRate = 24000, channels = 1, bitDepth = 16) {
  // Convert base64 to ArrayBuffer
  const binaryString = atob(pcmBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Calculate WAV file size
  const dataSize = bytes.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;
  
  // Create WAV header
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // File size
  view.setUint32(4, fileSize - 8, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // Format chunk identifier
  writeString(view, 12, 'fmt ');
  // Format chunk size
  view.setUint32(16, 16, true);
  // Sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // Channel count
  view.setUint16(22, channels, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate
  view.setUint32(28, sampleRate * channels * bitDepth / 8, true);
  // Block align
  view.setUint16(32, channels * bitDepth / 8, true);
  // Bits per sample
  view.setUint16(34, bitDepth, true);
  // Data chunk identifier
  writeString(view, 36, 'data');
  // Data chunk size
  view.setUint32(40, dataSize, true);
  // Write PCM data
  for (let i = 0; i < bytes.length; i++) {
    view.setUint8(headerSize + i, bytes[i]);
  }
  
  return buffer;
}

// Helper function to write string to DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Function to save audio as WAV file
async function saveAudioAsWav(audioData, filename = 'note-audio.wav') {
  try {
    // Convert PCM to WAV
    const wavBuffer = convertPcmToWav(audioData);
    
    // Create blob and download
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error saving audio as WAV:', error);
    throw error;
  }
}

export { getSynthesizedAudio, saveAudioAsWav, controlWebSpeechPlayback };