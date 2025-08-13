import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import wav from 'wav';

async function saveWaveFile(
  filename,
  pcmData,
  channels = 1,
  rate = 24000,
  sampleWidth = 2,
) {
  return new Promise((resolve, reject) => {
    const writer = new wav.FileWriter(filename, {
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    writer.on('finish', resolve);
    writer.on('error', reject);

    writer.write(pcmData);
    writer.end();
  });
}

async function synthesizeSpeech(text, voiceName = 'Kore') {
  // Ensure API_KEY is set in your environment variables
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-preview-tts"
  });

  const result = await model.generateContent({
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const audioData = result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    throw new Error('No audio data received.');
  }
  
  const audioBuffer = Buffer.from(audioData, 'base64');
  return audioBuffer;
}

async function main() {
  try {
    const text = 'Say cheerfully: Have a wonderful day!';
    const audioBuffer = await synthesizeSpeech(text, 'Kore');
    
    const fileName = 'out.wav';
    await saveWaveFile(fileName, audioBuffer);
    console.log(`Audio saved to ${fileName}`);
  } catch (error) {
    console.error('Error synthesizing speech:', error);
  }
}

// Export the function for use in other modules
export { synthesizeSpeech };

// Run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}