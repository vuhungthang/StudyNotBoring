# StudyNotBoring Documentation

## Overview
StudyNotBoring is a web-based application for organizing notes into notebooks with AI-powered features like note generation and infographic creation.

## Recent Changes

### 5. Shadcn/UI Component Implementation

#### Modern UI Components
A new set of reusable UI components inspired by [shadcn/ui](https://ui.shadcn.com/) has been implemented to improve the user interface:

1. **Button Component**
   - Multiple variants: default, secondary, destructive, outline
   - Consistent styling and hover effects
   - Used throughout the application for actions

2. **Card Component**
   - Content containers with header, content, and footer sections
   - Used for settings panels and note displays
   - Consistent border and shadow styling

3. **Form Components**
   - Input: Styled text input fields
   - Select: Styled dropdown select elements
   - Textarea: Styled multi-line text input
   - All form elements have consistent focus states and styling

4. **Additional Components**
   - Badge: Small status indicators with multiple variants
   - Alert: Contextual messages with titles and descriptions
   - Dialog: Modal dialogs for important actions or information

#### Styling Improvements
- Updated CSS with a consistent color palette using CSS variables
- Improved spacing and typography throughout the application
- Better responsive design for mobile devices
- Enhanced accessibility with proper focus states
- Modern button styles with hover effects

#### Component Structure
All components are located in the `components/ui` directory:
- `button.js`: Button component with multiple variants
- `card.js`: Card component with sub-components (Header, Title, Content, Footer)
- `input.js`: Styled input component
- `select.js`: Styled select component
- `textarea.js`: Styled textarea component
- `badge.js`: Badge component with multiple variants
- `alert.js`: Alert component with title and description
- `dialog.js`: Dialog component for modal interfaces
- `form.js`: Form-related components
- `label.js`: Styled label component
- `tabs.js`: Tabs component for navigation

A demo of these components can be viewed in `test-components.html`.

### 4. Podcast Generation Feature

#### Generate Podcast from Note
A new feature has been added to convert notes into engaging podcast conversations:
- Navigate to the Podcast tab
- Select a note from the dropdown in the "Generate from Note" section
- Enter a podcast title (optional, will default to note title if empty)
- Click "Generate Podcast from Note"
- The note content is automatically converted into a conversational format
- The podcast is generated using Google Generative AI with multi-speaker voices
- Listen to the podcast using the built-in player
- Download the podcast as a WAV file

#### Manual Podcast Creation
Users can also create podcasts manually:
- Navigate to the Podcast tab
- Enter speaker names and select voices in the "Manual Conversation" section
- Write a conversation in the text area following the provided format
- Click "Generate Podcast"
- The podcast is generated using Google Generative AI with multi-speaker voices
- Listen to the podcast using the built-in player
- Download the podcast as a WAV file

### 3. Audio Download Feature

#### Download Audio
A new feature has been added to download notes as WAV audio files:
- Navigate to the Notes tab
- Find the note you want to download as audio
- Click "Download Audio" on that note
- The note will be converted to speech using Google Generative AI
- The audio will be downloaded as a WAV file with a name based on the note title
- Requires a valid Gemini API key to be set in the Settings

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
The "Add New Note" functionality has been moved from the Settings tab to be integrated directly within each notebook:
- Navigate to the Notebooks tab
- Find the notebook you want to add a note to
- Enter note title and content in the form below the notebook name
- Note is added directly to that notebook
- No need to switch tabs to view the new note

#### Generate Note with AI
The "Generate Note with AI" feature is now also integrated within each notebook:
- Navigate to the Notebooks tab
- Find the notebook you want to add an AI-generated note to
- Enter a topic or question for the AI to expand upon
- AI-generated content is automatically formatted with proper HTML styling
- Note is added directly to that notebook
- No need to switch tabs to view the new note

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
- Model: gemini-2.5-flash-preview-tts
   - Requires a valid Gemini API key (no fallback)

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
- Uses Gemini API for high-quality speech (requires API key)
- Shows an error if the API is not configured

### Audio Download
- Download your notes as high-quality WAV audio files
- Uses Google Generative AI with the new Gemini 2.5 Flash TTS model for text-to-speech conversion
- Requires a valid Gemini API key
- Files are automatically named based on the note title

### Note Formatting
- AI-generated notes are automatically formatted with:
  - Proper heading hierarchy
  - Bold and italic text
  - Code blocks
  - Lists
  - Paragraph spacing

### Podcast Generation
- Convert notes into engaging conversations between two speakers
- Manual conversation creation with speaker customization
- Multi-speaker voice synthesis using Google Generative AI
- Natural conversation flow with questions and reactions
- WAV audio output for compatibility across devices