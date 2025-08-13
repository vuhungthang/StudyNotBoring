# StudyNotBoring

A web-based application for organizing notes into notebooks with AI-powered features.

## Features

- **Notebooks**: Organize your notes into custom notebooks
- **AI-Powered Note Generation**: Create notes automatically on any topic
- **Infographic Creation**: Transform your notes into visual infographics
- **Text-to-Speech**: Listen to your notes being read aloud
- **API Integration**: Works with OpenRouter and Gemini APIs

## Setup

1. Open `index.html` in a web browser
2. Navigate to the Settings tab to configure your API keys:
   - OpenRouter API key for AI features
   - Gemini API key for enhanced voice synthesis (optional)
3. Select your preferred AI model
4. Start creating notebooks and notes!

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
3. The note will be read aloud using text-to-speech

## Technical Details

- All data is stored locally in your browser's localStorage
- No server required - works completely offline after initial setup
- Built with vanilla JavaScript, HTML, and CSS

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for detailed information about the implementation and recent changes.