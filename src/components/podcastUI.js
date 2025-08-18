// podcastUI.js
import { generatePodcast, generatePodcastConversation, parsePodcastConversation } from '../components/podcastGenerator.js';
import UIComponents from './ui.js';

class PodcastUI {
  constructor() {
    this.container = null;
    this.isInitialized = false;
    this.notebooks = {};
    this.currentPodcastBlob = null;
    this.currentPodcastName = null;
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with id '${containerId}' not found`);
      return;
    }

    // Load notebooks from localStorage
    this.loadNotebooks();
    
    this.render();
    this.attachEventListeners();
    this.isInitialized = true;
  }

  loadNotebooks() {
    try {
      const notebooksData = localStorage.getItem('notebooks');
      this.notebooks = notebooksData ? JSON.parse(notebooksData) : {};
      
      // Migrate old format notebooks to new format
      for (const notebookName in this.notebooks) {
        if (Array.isArray(this.notebooks[notebookName])) {
          // Convert old format to new format
          this.notebooks[notebookName] = {
            notes: this.notebooks[notebookName],
            description: ''
          };
        }
      }
      
      console.log('Loaded notebooks for podcast UI:', this.notebooks);
    } catch (error) {
      console.error('Error loading notebooks:', error);
      this.notebooks = {};
    }
  }

  createNotebookOptions() {
    let options = '<option value="">Select a notebook</option>';
    
    for (const notebookName in this.notebooks) {
      options += `<option value="${notebookName}">${notebookName}</option>`;
    }
    
    return options;
  }

  // Helper function to get all notes from notebooks (handling both old and new formats)
  getAllNotes() {
    const allNotes = [];
    
    for (const notebookName in this.notebooks) {
      if (Array.isArray(this.notebooks[notebookName])) {
        // Old format - notebook is directly an array of notes
        this.notebooks[notebookName].forEach(note => {
          allNotes.push({
            ...note,
            notebookName
          });
        });
      } else if (this.notebooks[notebookName].notes) {
        // New format - notebook is an object with notes array
        this.notebooks[notebookName].notes.forEach(note => {
          allNotes.push({
            ...note,
            notebookName
          });
        });
      }
    }
    
    return allNotes;
  }

  createNoteOptions() {
    let options = '<option value="">Select a note</option>';
    
    // Get all notes using the helper function
    const allNotes = this.getAllNotes();
    
    allNotes.forEach(note => {
      // Properly escape the content for use in HTML attributes
      const escapedContent = note.content
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '\n'); // Preserve newlines
      options += `<option value="${note.notebookName}::${note.id}" data-content="${escapedContent}">${note.notebookName} - ${note.title}</option>`;
    });
    
    return options;
  }

  render() {
    if (!this.container) return;

    // Create options for notebooks and notes
    const notebookOptions = this.createNotebookOptions();
    const noteOptions = this.createNoteOptions();
    
    console.log('Rendering podcast UI with notebooks:', this.notebooks);
    
    // Main template
    const template = `
      <div class="podcast-studio">
        <style>
          .rotated {
            transform: rotate(180deg);
            transition: transform 0.3s ease;
          }
          
          .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 0;
            background: none;
            border: none;
            cursor: pointer;
          }
          
          .settings-header h2 {
            margin: 0;
          }
          
          .toggle-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 6px;
            transition: background-color 0.2s;
          }
          
          .toggle-btn:hover {
            background-color: rgba(0, 0, 0, 0.05);
          }
          
          .toggle-btn svg {
            transition: transform 0.3s ease;
          }
        </style>
        <div class="podcast-header">
          <h1>Podcast Studio</h1>
          <p>Transform your notes into engaging audio conversations</p>
        </div>
        
        <div class="podcast-layout">
          <!-- Main Content Area -->
          <div class="podcast-main">
            <!-- Generate Podcast Card -->
            <div class="podcast-card">
              <div class="card-header">
                <h2>Generate from Note</h2>
                ${UIComponents.badge({ variant: "secondary", children: "AI-Powered" })}
              </div>
              
              <div class="card-content">
                <div class="form-group">
                  <label for="note-select">Select Note</label>
                  <select id="note-select" class="form-select">${noteOptions}</select>
                </div>
                
                <div class="form-group">
                  <label for="podcast-title">Podcast Title</label>
                  <input type="text" id="podcast-title" class="form-input" placeholder="Enter podcast title">
                </div>
                
                <div class="form-group">
                  <label for="podcast-description">Description (Optional)</label>
                  <textarea id="podcast-description" class="form-textarea" placeholder="Enter podcast description"></textarea>
                </div>
                
                <button id="generate-from-note-btn" class="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                  Generate Podcast
                </button>
              </div>
            </div>
            
            <!-- Settings Card -->
            <div class="podcast-card">
              <div class="card-header">
                <button class="settings-header" id="toggle-settings-btn">
                  <h2>Settings</h2>
                  <div class="toggle-btn">
                    <span id="toggle-text">Expand</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </button>
              </div>
              
              <div id="podcast-settings" class="card-content hidden">
                <div class="settings-grid">
                  <div class="setting-item">
                    <label for="speaker1-name">Speaker 1 Name</label>
                    <input type="text" id="speaker1-name" class="form-input" value="Alex" placeholder="Enter name">
                  </div>
                  
                  <div class="setting-item">
                    <label for="speaker1-voice">Speaker 1 Voice</label>
                    <select id="speaker1-voice" class="form-select">
                      <option value="Kore">Kore (Default)</option>
                      <option value="Clyde">Clyde</option>
                      <option value="Antoni">Antoni</option>
                      <option value="Orion">Orion</option>
                      <option value="Dallas">Dallas</option>
                      <option value="Zach">Zach</option>
                    </select>
                  </div>
                  
                  <div class="setting-item">
                    <label for="speaker2-name">Speaker 2 Name</label>
                    <input type="text" id="speaker2-name" class="form-input" value="Sam" placeholder="Enter name">
                  </div>
                  
                  <div class="setting-item">
                    <label for="speaker2-voice">Speaker 2 Voice</label>
                    <select id="speaker2-voice" class="form-select">
                      <option value="Puck">Puck (Default)</option>
                      <option value="Viktor">Viktor</option>
                      <option value="Luna">Luna</option>
                      <option value="Grace">Grace</option>
                      <option value="Carter">Carter</option>
                      <option value="Moss">Moss</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Preview Area -->
          <div class="podcast-sidebar">
            <div class="podcast-card">
              <div class="card-header">
                <h2>Preview</h2>
              </div>
              <div class="card-content">
                <div id="podcast-status" class="status-message hidden"></div>
                <div id="podcast-player" class="audio-player hidden">
                  <audio id="podcast-audio" controls></audio>
                  <div class="player-controls">
                    <button id="play-btn" class="btn btn-secondary">Play</button>
                    <button id="download-podcast-btn" class="btn btn-secondary">Download</button>
                  </div>
                </div>
                <div class="preview-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
                  </svg>
                  <p>Your generated podcast will appear here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = template;
  }

  attachEventListeners() {
    // Use event delegation for better reliability
    this.container.addEventListener('click', (e) => {
      const target = e.target;
      
      // Handle generate from note button
      if (target.id === 'generate-from-note-btn') {
        e.preventDefault();
        this.generatePodcastFromNote();
        return;
      }
      
      // Handle download button
      if (target.id === 'download-podcast-btn') {
        e.preventDefault();
        this.downloadPodcast();
        return;
      }
      
      // Handle play button
      if (target.id === 'play-btn') {
        e.preventDefault();
        const audioEl = document.getElementById('podcast-audio');
        if (audioEl) {
          if (audioEl.paused) {
            audioEl.play();
            target.textContent = 'Pause';
          } else {
            audioEl.pause();
            target.textContent = 'Play';
          }
        }
        return;
      }
      
      // Handle toggle settings button
      if (target.id === 'toggle-settings-btn' || target.closest('#toggle-settings-btn')) {
        e.preventDefault();
        const podcastSettings = document.getElementById('podcast-settings');
        const svg = document.querySelector('#toggle-settings-btn svg');
        const toggleText = document.getElementById('toggle-text');
        
        if (podcastSettings && svg && toggleText) {
          const isVisible = !podcastSettings.classList.contains('hidden');
          
          if (isVisible) {
            podcastSettings.classList.add('hidden');
            toggleText.textContent = 'Expand';
            svg.classList.remove('rotated');
          } else {
            podcastSettings.classList.remove('hidden');
            toggleText.textContent = 'Collapse';
            svg.classList.add('rotated');
          }
        }
        return;
      }
    });
    
    // Handle note selection change
    this.container.addEventListener('change', (e) => {
      const target = e.target;
      
      if (target.id === 'note-select') {
        const selectedOption = target.options[target.selectedIndex];
        const podcastTitleInput = document.getElementById('podcast-title');
        
        if (selectedOption.value && podcastTitleInput) {
          // Set the podcast title to the note title if it's empty
          if (!podcastTitleInput.value.trim()) {
            podcastTitleInput.value = selectedOption.text.replace(/.* - /, '');
          }
        }
      }
    });
  }

  parseConversation(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const conversation = [];
    
    // Get speaker names from the form
    const speaker1Name = document.getElementById('speaker1-name')?.value || 'Speaker 1';
    const speaker2Name = document.getElementById('speaker2-name')?.value || 'Speaker 2';
    
    lines.forEach(line => {
      // Try to match speaker names
      if (line.startsWith(speaker1Name + ':')) {
        const text = line.substring(speaker1Name.length + 1).trim();
        conversation.push({ speaker: 'Speaker 1', text }); // Always use "Speaker 1" for the first speaker
      } else if (line.startsWith(speaker2Name + ':')) {
        const text = line.substring(speaker2Name.length + 1).trim();
        conversation.push({ speaker: 'Speaker 2', text }); // Always use "Speaker 2" for the second speaker
      } else if (line.includes(':')) {
        // If we can't match exact names, alternate between speakers
        const colonIndex = line.indexOf(':');
        const speakerText = line.substring(colonIndex + 1).trim();
        // Alternate between speakers
        const speaker = conversation.length % 2 === 0 ? 'Speaker 1' : 'Speaker 2';
        conversation.push({ speaker, text: speakerText });
      } else if (line.trim() !== '') {
        // Handle lines without colons - treat as continuation of previous speaker
        if (conversation.length > 0) {
          // Add to the last speaker's text
          conversation[conversation.length - 1].text += ' ' + line.trim();
        } else {
          // If no previous speaker, assign to Speaker 1
          conversation.push({ speaker: 'Speaker 1', text: line.trim() });
        }
      }
    });
    
    // Enhance conversation flow by adding natural reactions where appropriate
    const enhancedConversation = [];
    for (let i = 0; i < conversation.length; i++) {
      enhancedConversation.push(conversation[i]);
      
      // Add reactions every few lines to make it more conversational
      if (i < conversation.length - 1 && i % 2 === 1) {
        // Add a reaction from the next speaker
        const nextSpeaker = conversation[i+1].speaker;
        const reactions = [
          "That's really interesting!",
          "I never thought of it that way.",
          "Wow, I can see why that matters.",
          "That makes a lot of sense.",
          "How does that work exactly?",
          "Can you tell me more about that?"
        ];
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        enhancedConversation.push({ speaker: nextSpeaker, text: randomReaction });
      }
    }
    
    return enhancedConversation;
  }

  // New function to generate podcast from note content
  async generatePodcastFromNote() {
    const statusEl = document.getElementById('podcast-status');
    const playerEl = document.getElementById('podcast-player');
    const audioEl = document.getElementById('podcast-audio');
    const noteSelect = document.getElementById('note-select');
    const podcastTitleInput = document.getElementById('podcast-title');
    
    // Validate input
    const selectedNote = noteSelect?.value;
    if (!selectedNote) {
      if (statusEl) {
        statusEl.textContent = 'Please select a note.';
        statusEl.className = 'status-message error';
        statusEl.classList.remove('hidden');
      }
      return;
    }
    
    // Get note content
    const selectedOption = noteSelect.options[noteSelect.selectedIndex];
    const noteContent = selectedOption.getAttribute('data-content');
    
    if (!noteContent) {
      if (statusEl) {
        statusEl.textContent = 'Could not retrieve note content.';
        statusEl.className = 'status-message error';
        statusEl.classList.remove('hidden');
      }
      return;
    }
    
    // Decode the escaped content
    let decodedContent = noteContent
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#10;/g, '\n');
    
    // Get podcast title
    const podcastTitle = podcastTitleInput?.value.trim() || selectedOption.text.replace(/.* - /, '');
    
    // Update UI
    if (statusEl) {
      statusEl.textContent = 'Generating podcast from note...';
      statusEl.className = 'status-message';
      statusEl.classList.remove('hidden');
    }
    if (playerEl) {
      playerEl.classList.add('hidden');
    }
    
    try {
      // Get API key
      const apiKey = localStorage.getItem('openrouter-api-key');
      if (!apiKey) {
        throw new Error('Please set your OpenRouter API key in the settings');
      }
      
      // Get selected model
      const model = localStorage.getItem('selectedModel') || 'openrouter/auto';
      
      // Generate conversation using OpenRouter API
      const conversationText = await generatePodcastConversation(decodedContent, apiKey, model);
      
      // Parse the conversation
      const conversation = parsePodcastConversation(conversationText);
      
      if (conversation.length === 0) {
        throw new Error('Failed to parse conversation from AI response');
      }
      
      // Get selected speaker voices
      const speaker1Voice = document.getElementById('speaker1-voice')?.value || 'Kore';
      const speaker2Voice = document.getElementById('speaker2-voice')?.value || 'Puck';
      
      // Configure speakers (exactly 2 as required by the API)
      const speakerConfig = {
        'Speaker 1': speaker1Voice,  // First speaker
        'Speaker 2': speaker2Voice   // Second speaker
      };
      
      // Generate podcast
      const wavBlob = await generatePodcast(conversation, 'podcast.wav', speakerConfig);
      
      // Update audio player
      if (audioEl) {
        const audioUrl = URL.createObjectURL(wavBlob);
        audioEl.src = audioUrl;
      }
      
      // Show player
      if (playerEl) {
        playerEl.classList.remove('hidden');
      }
      if (statusEl) {
        statusEl.textContent = `Podcast "${podcastTitle}" generated successfully!`;
        statusEl.className = 'status-message success';
      }
      
      // Store for download
      this.currentPodcastBlob = wavBlob;
      this.currentPodcastName = podcastTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_podcast.wav';
    } catch (error) {
      console.error('Error generating podcast from note:', error);
      if (statusEl) {
        statusEl.textContent = 'Error: ' + error.message;
        statusEl.className = 'status-message error';
      }
    }
  }

  // This method is kept for backward compatibility but may not be used in the current UI
  async generatePodcast() {
    const statusEl = document.getElementById('podcast-status');
    const playerEl = document.getElementById('podcast-player');
    const audioEl = document.getElementById('podcast-audio');
    
    // Get form values
    const speaker1Voice = document.getElementById('speaker1-voice')?.value || 'Kore';
    const speaker2Voice = document.getElementById('speaker2-voice')?.value || 'Puck';
    
    // For demo purposes, we'll create a simple conversation
    const conversation = [
      { speaker: 'Speaker 1', text: 'Welcome to our podcast!' },
      { speaker: 'Speaker 2', text: 'Today we\'ll be discussing an interesting topic.' },
      { speaker: 'Speaker 1', text: 'Let\'s dive right in!' }
    ];
    
    // Configure speakers (exactly 2 as required by the API)
    const speakerConfig = {
      'Speaker 1': speaker1Voice,
      'Speaker 2': speaker2Voice
    };
    
    // Update UI
    if (statusEl) {
      statusEl.textContent = 'Generating podcast...';
      statusEl.className = 'status-message';
      statusEl.classList.remove('hidden');
    }
    if (playerEl) {
      playerEl.classList.add('hidden');
    }
    
    try {
      // Generate podcast
      const wavBlob = await generatePodcast(conversation, 'podcast.wav', speakerConfig);
      
      // Update audio player
      if (audioEl) {
        const audioUrl = URL.createObjectURL(wavBlob);
        audioEl.src = audioUrl;
      }
      
      // Show player
      if (playerEl) {
        playerEl.classList.remove('hidden');
      }
      if (statusEl) {
        statusEl.textContent = 'Podcast generated successfully!';
        statusEl.className = 'status-message success';
      }
      
      // Store for download
      this.currentPodcastBlob = wavBlob;
      this.currentPodcastName = 'podcast.wav';
    } catch (error) {
      console.error('Error generating podcast:', error);
      if (statusEl) {
        statusEl.textContent = 'Error: ' + error.message;
        statusEl.className = 'status-message error';
      }
    }
  }

  downloadPodcast() {
    if (!this.currentPodcastBlob) {
      alert('No podcast to download. Please generate a podcast first.');
      return;
    }
    
    // Create download link
    const url = URL.createObjectURL(this.currentPodcastBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.currentPodcastName || 'podcast.wav';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // Method to refresh notebooks data and re-render
  refresh() {
    this.loadNotebooks();
    this.render();
  }
}

// Export as default
export default PodcastUI;