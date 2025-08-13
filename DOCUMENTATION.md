# StudyNotBoring Documentation

## Overview
StudyNotBoring is a web-based application for organizing notes into notebooks with AI-powered features like note generation and infographic creation.

## Recent Changes

### 1. Settings Restructuring

#### API Configuration and AI Model Selection
The Settings section has been reorganized to focus solely on API configuration and AI model selection:

1. **API Configuration**
   - Configure your OpenRouter API key for AI features
   - Configure your Gemini API key for voice synthesis
   - Keys are securely stored in browser's localStorage
   - Form can be hidden after saving for a cleaner interface

2. **AI Model Selection**
   - Choose from a variety of AI models for note generation
   - Supports popular models like GPT-3.5, GPT-4, Claude, Gemini, and Llama
   - Option to specify a custom model name
   - Selected model is saved and used for all AI operations

### 2. Notebook-Integrated Note Creation

#### Add New Note
The "Add New Note" functionality has been moved to be associated with individual notebooks:
- Select a specific notebook from the dropdown
- Enter note title and content
- Note is added directly to the selected notebook
- After creation, the interface automatically switches to the Notes tab to view the new note

#### Generate Note with AI
The "Generate Note with AI" feature is now also integrated with notebooks:
- Select a specific notebook for the AI-generated note
- Enter a topic or question for the AI to expand upon
- AI-generated content is automatically formatted with proper HTML styling
- After generation, the interface switches to the Notes tab to view the new note

## Technical Implementation Details

### Data Structure
Notes are organized in a hierarchical structure:
```
notebooks: {
  "Notebook Name": [
    {
      id: number,
      title: string,
      content: string,
      timestamp: string
    }
  ]
}
```

### Local Storage Usage
- `notebooks`: Stores all notebooks and their notes
- `openrouter-api-key`: OpenRouter API key for AI features
- `gemini-api-key`: Gemini API key for voice synthesis
- `selectedModel`: Currently selected AI model for generation

### API Integration
1. **OpenRouter API**
   - Used for AI note generation and infographic creation
   - Endpoint: https://openrouter.ai/api/v1/chat/completions
   - Supports multiple AI models

2. **Gemini API**
   - Used for text-to-speech functionality
   - Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent
   - Falls back to Web Speech API if no key is provided

### UI Components

#### Tab Navigation
- Notes tab: View all notes with filtering by notebook
- Notebooks tab: Create and manage notebooks
- Settings tab: Configure API keys and AI models

#### Responsive Design
- Adapts to different screen sizes
- Mobile-friendly layout with appropriate spacing and sizing

## Usage Instructions

### Setting up API Keys
1. Navigate to the Settings tab
2. Enter your OpenRouter API key for AI features
3. Optionally enter your Gemini API key for enhanced voice synthesis
4. Click "Save" to store the keys

### Selecting an AI Model
1. In the Settings tab, find the AI Model Selection section
2. Choose from the predefined models or enter a custom model name
3. Click "Save Model" to apply your selection

### Creating Notebooks
1. Go to the Notebooks tab
2. Enter a name for your new notebook
3. Click "Create Notebook"

### Adding Notes
1. Go to the Settings tab
2. Select a notebook from the dropdown
3. Enter a title and content for your note
4. Click "Add Note"

### Generating AI Notes
1. Go to the Settings tab
2. Select a notebook for the new note
3. Enter a topic or question in the prompt field
4. Click "Generate Note"
5. The AI will create a formatted note and add it to the selected notebook

### Viewing Notes
1. Navigate to the Notes tab
2. Optionally filter notes by notebook using the dropdown
3. All notes are sorted by creation date (newest first)

## Features

### Infographic Generation
- Create visual representations of your notes
- Uses AI to transform text content into HTML infographics
- Outputs print-ready A4 formatted documents

### Voice Synthesis
- Listen to your notes being read aloud
- Uses Gemini API for high-quality speech or Web Speech API as fallback
- Works offline with the browser's built-in speech synthesis

### Note Formatting
- AI-generated notes are automatically formatted with:
  - Proper heading hierarchy
  - Bold and italic text
  - Code blocks
  - Lists
  - Paragraph spacing