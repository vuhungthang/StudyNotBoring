// Function to save wave file (browser version)
async function saveWaveFile(
  filename,
  pcmData,
  channels = 1,
  rate = 24000,
  sampleWidth = 2,
) {
  // In browser environment, we'll return the blob instead of saving to file
  // Convert base64 to ArrayBuffer
  const binaryString = atob(pcmData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create WAV header (simplified version)
  const buffer = new ArrayBuffer(44 + bytes.length);
  const view = new DataView(buffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // File size
  view.setUint32(4, 36 + bytes.length, true);
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
  view.setUint32(24, rate, true);
  // Byte rate
  view.setUint32(28, rate * channels * sampleWidth, true);
  // Block align
  view.setUint16(32, channels * sampleWidth, true);
  // Bits per sample
  view.setUint16(34, sampleWidth * 8, true);
  // Data chunk identifier
  writeString(view, 36, 'data');
  // Data chunk size
  view.setUint32(40, bytes.length, true);
  // Write PCM data
  for (let i = 0; i < bytes.length; i++) {
    view.setUint8(44 + i, bytes[i]);
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

// Helper function to write string to DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Function to generate multi-speaker podcast audio using direct API calls
async function generatePodcastAudio(conversation, speakerConfig = {}) {
  const API_KEY = localStorage.getItem('gemini-api-key') || process.env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    throw new Error('Please set your Google Cloud API key in the settings');
  }
  
  // Default speaker configuration (exactly 2 speakers as required)
  const defaultSpeakerConfig = {
    'Speaker 1': 'Kore',
    'Speaker 2': 'Puck'
  };
  
  // Merge with provided config, but ensure we only have 2 speakers
  let config = { ...defaultSpeakerConfig, ...speakerConfig };
  
  // If we have more than 2 speakers, limit to the first 2
  const speakerEntries = Object.entries(config);
  if (speakerEntries.length > 2) {
    config = Object.fromEntries(speakerEntries.slice(0, 2));
  }
  
  // If we have less than 2 speakers, pad with default speakers
  const speakerNames = Object.keys(config);
  if (speakerNames.length < 2) {
    const defaultNames = Object.keys(defaultSpeakerConfig);
    for (let i = speakerNames.length; i < 2; i++) {
      if (!config[defaultNames[i]]) {
        config[defaultNames[i]] = defaultSpeakerConfig[defaultNames[i]];
      }
    }
  }
  
  // Format conversation for the prompt
  let conversationText = '';
  conversation.forEach(line => {
    conversationText += `${line.speaker}: ${line.text}
`;
  });
  
  const prompt = `TTS the following conversation:
${conversationText}`;
  
  // Prepare speaker voice configurations (exactly 2 as required)
  const speakerVoiceConfigs = Object.entries(config).slice(0, 2).map(([speaker, voiceName], index) => ({
    speaker: `Speaker ${index + 1}`,
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName }
    }
  }));
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs
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
    
    return audioPart.inlineData.data;
  } catch (error) {
    console.error('Error generating podcast audio:', error);
    throw error;
  }
}

// Function to generate a podcast from structured conversation data
async function generatePodcast(conversation, outputFile = 'podcast.wav', speakerConfig = {}) {
  try {
    const audioData = await generatePodcastAudio(conversation, speakerConfig);
    
    // Convert to WAV blob
    const wavBlob = await saveWaveFile(outputFile, audioData);
    
    console.log(`Podcast generated successfully`);
    return wavBlob;
  } catch (error) {
    console.error('Error generating podcast:', error);
    throw error;
  }
}

// Function to generate podcast conversation using OpenRouter API
async function generatePodcastConversation(content, apiKey, model) {
  const prompt = `Transform the following content into a natural, engaging podcast conversation between two speakers (Speaker 1 and Speaker 2). 
The conversation should be informative yet conversational, with questions, reactions, and natural dialogue.
Do not include any formatting, just plain text with each line starting with "Speaker 1:" or "Speaker 2:".

Content:
${content}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No choices returned from API');
  }
  
  return data.choices[0].message.content;
}

// Function to parse conversation text into structured format
function parsePodcastConversation(conversationText) {
  const lines = conversationText.split('\n').filter(line => line.trim() !== '');
  const conversation = [];
  
  lines.forEach(line => {
    // Match lines starting with "Speaker 1:" or "Speaker 2:"
    const speakerMatch = line.match(/^(Speaker \d+): (.*)/);
    if (speakerMatch) {
      const speaker = speakerMatch[1];
      const text = speakerMatch[2].trim();
      conversation.push({ speaker, text });
    }
  });
  
  return conversation;
}

// Export functions for use in other modules
export { generatePodcastAudio, generatePodcast, generatePodcastConversation, parsePodcastConversation };