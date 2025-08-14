# StudyNotBoring

A web-based application for organizing notes into notebooks with AI-powered features.

## Features

- **Notebooks**: Organize your notes into custom notebooks
- **AI-Powered Note Generation**: Create notes automatically on any topic
- **Infographic Creation**: Transform your notes into visual infographics
- **Text-to-Speech**: Listen to your notes being read aloud
- **Podcast Generation**: Convert your notes into engaging podcast conversations
- **API Integration**: Works with OpenRouter and Gemini APIs
- **Shadcn/UI Components**: Modern, accessible UI components for a better user experience

## Getting Started

1. Clone this repository
2. Open `index.html` in your browser
3. Set your Google Generative AI API key in the settings
4. Start taking notes!

## API Key Setup

To use the text-to-speech functionality, you'll need to set up a Google Generative AI API key:

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Copy the API key
4. In the StudyNotBoring app, go to Settings and paste your API key in the "Gemini API Key" field

## Usage

### Creating Notebooks
1. Go to the Notebooks tab
2. Enter a name for your new notebook
3. Click "Create Notebook"

### Adding Notes
1. Go to the Notebooks tab
2. Find the notebook you want to add a note to
3. Enter a title and content for your note in the form below the notebook name
4. Click "Add Note"

### Generating AI Notes
1. Go to the Notebooks tab
2. Find the notebook you want to add an AI-generated note to
3. Enter a topic or question in the prompt field in the AI form below the notebook name
4. Click "Generate Note"

### Creating Infographics
1. In the Notes tab, find the note you want to visualize
2. Click "Create Infographic" on that note
3. The infographic will open in a new window

### Listening to Notes
1. In the Notes tab, find the note you want to hear
2. Click "Listen" on that note
3. The note will be read aloud using the new Gemini 2.5 Flash TTS model

### Downloading Audio Files
1. In the Notes tab, find the note you want to download as audio
2. Click "Download Audio" on that note
3. The note will be converted to speech and downloaded as a WAV file
4. You'll need to set your Gemini API key in Settings for this feature to work

### Creating Podcasts
1. Go to the Podcast tab
2. To create a podcast from a note:
   - Select a note from the dropdown
   - Enter a podcast title (optional)
   - Click "Generate Podcast from Note"
3. To create a podcast manually:
   - Enter speaker names and select voices
   - Write a conversation in the text area
   - Click "Generate Podcast"
4. Listen to your podcast using the player
5. Download your podcast as a WAV file

## UI Components

This project now includes a set of reusable UI components inspired by [shadcn/ui](https://ui.shadcn.com/):

- **Button**: Primary, secondary, destructive, and outline variants
- **Card**: Content container with header, content, and footer sections
- **Input**: Styled text input fields
- **Select**: Styled dropdown select elements
- **Textarea**: Styled multi-line text input
- **Badge**: Small status indicators with multiple variants
- **Alert**: Contextual messages with titles and descriptions
- **Dialog**: Modal dialogs for important actions or information

You can view a demo of these components in `test-components.html`.

## Technical Details

- All data is stored locally in your browser's localStorage
- No server required - works completely offline after initial setup
- Built with vanilla JavaScript, HTML, and CSS
- Uses Tailwind CSS for styling with a custom color palette
- UI components are built with accessibility in mind

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for detailed information about the implementation and recent changes.