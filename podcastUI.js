// podcastUI.js
import { generatePodcast, generatePodcastConversation, parsePodcastConversation } from './podcastGenerator.js';

class PodcastUI {
  constructor() {
    this.container = null;
    this.isInitialized = false;
    this.notebooks = {};
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
    this.isInitialized = true;
  }

  loadNotebooks() {
    try {
      const notebooksData = localStorage.getItem('notebooks');
      this.notebooks = notebooksData ? JSON.parse(notebooksData) : {};
    } catch (error) {
      console.error('Error loading notebooks:', error);
      this.notebooks = {};
    }
  }

  render() {
    if (!this.container) return;

    // Create options for notebooks and notes
    let notebookOptions = '<option value="">Select a notebook</option>';
    let noteOptions = '<option value="">Select a note</option>';
    
    for (const notebookName in this.notebooks) {
      notebookOptions += `<option value="${notebookName}">${notebookName}</option>`;
      
      // Add notes from this notebook
      this.notebooks[notebookName].forEach(note => {
        // Properly escape the content for use in HTML attributes
        const escapedContent = note.content
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '&#10;'); // Preserve newlines
        noteOptions += `<option value="${notebookName}::${note.id}" data-content="${escapedContent}">${notebookName} - ${note.title}</option>`;
      });
    }

    this.container.innerHTML = `
      <div class="podcast-generator max-w-6xl mx-auto">
        <header class="text-center mb-12">
          <h1 class="text-4xl font-bold mb-4">Podcast Studio</h1>
          <p class="text-lg text-muted-foreground">Transform your notes into engaging audio conversations</p>
        </header>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2">
            <div class="card mb-8">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold">Generate from Note</h2>
                <div class="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  AI-Powered
                </div>
              </div>
              
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium mb-2">Select a Note</label>
                  <select id="note-select" class="form-select">
                    ${noteOptions}
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-2">Podcast Title</label>
                  <input type="text" id="podcast-title" placeholder="Enter a title for your podcast" class="form-input">
                </div>
                
                <div class="settings-section">
                  <div class="settings-section-header">
                    <h3 class="settings-section-title">Advanced Settings</h3>
                    <button id="toggle-settings-btn" class="toggle-settings-btn">
                      Expand
                    </button>
                  </div>
                  
                  <div id="podcast-settings" class="settings-content hidden">
                    <div class="voice-setting-row">
                      <div class="voice-setting-group">
                        <label class="voice-setting-label">Speaker 1 Voice</label>
                        <select id="speaker1-voice" class="voice-setting-select">
                          <option value="Kore">Kore (Firm)</option>
                          <option value="Puck">Puck (Upbeat)</option>
                          <option value="Charon">Charon (Informative)</option>
                          <option value="Zephyr">Zephyr (Bright)</option>
                          <option value="Fenrir">Fenrir (Excitable)</option>
                          <option value="Leda">Leda (Youthful)</option>
                          <option value="Orus">Orus (Firm)</option>
                          <option value="Aoede">Aoede (Breezy)</option>
                          <option value="Callirrhoe">Callirrhoe (Easy-going)</option>
                          <option value="Autonoe">Autonoe (Bright)</option>
                          <option value="Enceladus">Enceladus (Breathy)</option>
                          <option value="Iapetus">Iapetus (Clear)</option>
                          <option value="Umbriel">Umbriel (Easy-going)</option>
                          <option value="Algieba">Algieba (Smooth)</option>
                          <option value="Despina">Despina (Smooth)</option>
                          <option value="Erinome">Erinome (Clear)</option>
                          <option value="Algenib">Algenib (Gravelly)</option>
                          <option value="Rasalgethi">Rasalgethi (Informative)</option>
                          <option value="Laomedeia">Laomedeia (Upbeat)</option>
                          <option value="Achernar">Achernar (Soft)</option>
                          <option value="Alnilam">Alnilam (Firm)</option>
                          <option value="Schedar">Schedar (Even)</option>
                          <option value="Gacrux">Gacrux (Mature)</option>
                          <option value="Pulcherrima">Pulcherrima (Forward)</option>
                          <option value="Achird">Achird (Friendly)</option>
                          <option value="Zubenelgenubi">Zubenelgenubi (Casual)</option>
                          <option value="Vindemiatrix">Vindemiatrix (Gentle)</option>
                          <option value="Sadachbia">Sadachbia (Lively)</option>
                          <option value="Sadaltager">Sadaltager (Knowledgeable)</option>
                          <option value="Sulafat">Sulafat (Warm)</option>
                        </select>
                        <p class="text-xs text-muted-foreground mt-1">Select the voice for the first speaker</p>
                      </div>
                      
                      <div class="voice-setting-group">
                        <label class="voice-setting-label">Speaker 2 Voice</label>
                        <select id="speaker2-voice" class="voice-setting-select">
                          <option value="Puck">Puck (Upbeat)</option>
                          <option value="Kore">Kore (Firm)</option>
                          <option value="Charon">Charon (Informative)</option>
                          <option value="Zephyr">Zephyr (Bright)</option>
                          <option value="Fenrir">Fenrir (Excitable)</option>
                          <option value="Leda">Leda (Youthful)</option>
                          <option value="Orus">Orus (Firm)</option>
                          <option value="Aoede">Aoede (Breezy)</option>
                          <option value="Callirrhoe">Callirrhoe (Easy-going)</option>
                          <option value="Autonoe">Autonoe (Bright)</option>
                          <option value="Enceladus">Enceladus (Breathy)</option>
                          <option value="Iapetus">Iapetus (Clear)</option>
                          <option value="Umbriel">Umbriel (Easy-going)</option>
                          <option value="Algieba">Algieba (Smooth)</option>
                          <option value="Despina">Despina (Smooth)</option>
                          <option value="Erinome">Erinome (Clear)</option>
                          <option value="Algenib">Algenib (Gravelly)</option>
                          <option value="Rasalgethi">Rasalgethi (Informative)</option>
                          <option value="Laomedeia">Laomedeia (Upbeat)</option>
                          <option value="Achernar">Achernar (Soft)</option>
                          <option value="Alnilam">Alnilam (Firm)</option>
                          <option value="Schedar">Schedar (Even)</option>
                          <option value="Gacrux">Gacrux (Mature)</option>
                          <option value="Pulcherrima">Pulcherrima (Forward)</option>
                          <option value="Achird">Achird (Friendly)</option>
                          <option value="Zubenelgenubi">Zubenelgenubi (Casual)</option>
                          <option value="Vindemiatrix">Vindemiatrix (Gentle)</option>
                          <option value="Sadachbia">Sadachbia (Lively)</option>
                          <option value="Sadaltager">Sadaltager (Knowledgeable)</option>
                          <option value="Sulafat">Sulafat (Warm)</option>
                        </select>
                        <p class="text-xs text-muted-foreground mt-1">Select the voice for the second speaker</p>
                      </div>
                    </div>
                    
                    <div class="bg-secondary/50 rounded-lg p-3 mt-4">
                      <p class="text-xs text-muted-foreground">
                        <strong>Tip:</strong> Choose voices with different characteristics to create a more engaging conversation.
                      </p>
                    </div>
                  </div>
                </div>
                
                <button id="generate-from-note-btn" class="btn btn-primary w-full py-3">
                  Generate Podcast
                </button>
              </div>
            </div>
            
            <div class="card">
              <h2 class="text-2xl font-bold mb-6">Recent Podcasts</h2>
              <div class="space-y-4" id="recent-podcasts-list">
                <!-- Recent podcasts will be populated here -->
                <div class="text-center py-8 text-muted-foreground">
                  <p>No recent podcasts yet. Generate your first podcast to see it here!</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Sidebar -->
          <div>
            <div class="card mb-8">
              <h2 class="text-xl font-bold mb-4">How It Works</h2>
              <div class="space-y-4">
                <div class="flex items-start space-x-3">
                  <div class="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p class="text-sm">Select a note from your notebook to convert into a podcast</p>
                </div>
                
                <div class="flex items-start space-x-3">
                  <div class="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p class="text-sm">Our AI transforms your notes into a natural conversation</p>
                </div>
                
                <div class="flex items-start space-x-3">
                  <div class="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p class="text-sm">Choose voices and generate your audio podcast</p>
                </div>
              </div>
            </div>
            
            <div class="card">
              <h2 class="text-xl font-bold mb-4">Tips for Best Results</h2>
              <ul class="space-y-2 text-sm">
                <li class="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mr-2 mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Use detailed, well-structured notes for better conversion</span>
                </li>
                <li class="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mr-2 mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Focus on one main topic per podcast for clarity</span>
                </li>
                <li class="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mr-2 mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Experiment with different voice combinations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Status and Player -->
        <div class="mt-8">
          <div id="podcast-status" class="status hidden"></div>
          <div id="podcast-player" class="card hidden">
            <div class="text-center">
              <h3 class="text-xl font-bold mb-2">Your Podcast is Ready</h3>
              <p class="text-muted-foreground mb-6">Listen or download your generated podcast</p>
              
              <div class="bg-secondary/50 rounded-lg p-6 mb-6">
                <audio id="podcast-audio" controls class="w-full mb-4"></audio>
                <div class="flex justify-center space-x-4">
                  <button id="play-btn" class="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Play
                  </button>
                  <button id="download-podcast-btn" class="btn btn-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const generateBtn = document.getElementById('generate-podcast-btn');
    const generateFromNoteBtn = document.getElementById('generate-from-note-btn');
    const downloadBtn = document.getElementById('download-podcast-btn');
    const playBtn = document.getElementById('play-btn');
    const noteSelect = document.getElementById('note-select');
    const podcastTitleInput = document.getElementById('podcast-title');
    const toggleSettingsBtn = document.getElementById('toggle-settings-btn');
    const podcastSettings = document.getElementById('podcast-settings');
    const audioEl = document.getElementById('podcast-audio');
    
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generatePodcast());
    }
    
    if (generateFromNoteBtn) {
      generateFromNoteBtn.addEventListener('click', () => this.generatePodcastFromNote());
    }
    
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadPodcast());
    }
    
    if (playBtn && audioEl) {
      playBtn.addEventListener('click', () => {
        if (audioEl.paused) {
          audioEl.play();
          playBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>Pause';
        } else {
          audioEl.pause();
          playBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>Play';
        }
      });
    }
    
    if (noteSelect) {
      noteSelect.addEventListener('change', () => {
        const selectedOption = noteSelect.options[noteSelect.selectedIndex];
        if (selectedOption.value && podcastTitleInput) {
          // Set the podcast title to the note title if it's empty
          if (!podcastTitleInput.value.trim()) {
            podcastTitleInput.value = selectedOption.text.replace(/.* - /, '');
          }
        }
      });
    }
    
    // Toggle settings visibility
    if (toggleSettingsBtn && podcastSettings) {
      toggleSettingsBtn.addEventListener('click', () => {
        const isVisible = !podcastSettings.classList.contains('hidden');
        
        if (isVisible) {
          podcastSettings.classList.add('hidden');
          toggleSettingsBtn.textContent = 'Expand';
        } else {
          podcastSettings.classList.remove('hidden');
          toggleSettingsBtn.textContent = 'Collapse';
        }
      });
    }
  }

  parseConversation(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const conversation = [];
    
    // Get speaker names from the form
    const speaker1Name = document.getElementById('speaker1-name').value || 'Speaker 1';
    const speaker2Name = document.getElementById('speaker2-name').value || 'Speaker 2';
    
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
    const selectedNote = noteSelect.value;
    if (!selectedNote) {
      statusEl.textContent = 'Please select a note.';
      statusEl.className = 'status error';
      return;
    }
    
    // Get note content
    const selectedOption = noteSelect.options[noteSelect.selectedIndex];
    const noteContent = selectedOption.getAttribute('data-content');
    
    if (!noteContent) {
      statusEl.textContent = 'Could not retrieve note content.';
      statusEl.className = 'status error';
      return;
    }
    
    // Get podcast title
    const podcastTitle = podcastTitleInput.value.trim() || selectedOption.text.replace(/.* - /, '');
    
    // Update UI
    statusEl.textContent = 'Generating podcast from note...';
    statusEl.className = 'status';
    playerEl.style.display = 'none';
    
    try {
      // Get API key
      const apiKey = localStorage.getItem('openrouter-api-key');
      if (!apiKey) {
        throw new Error('Please set your OpenRouter API key in the settings');
      }
      
      // Get selected model
      const model = localStorage.getItem('selectedModel') || 'openrouter/auto';
      
      // Generate conversation using OpenRouter API
      const conversationText = await generatePodcastConversation(noteContent, apiKey, model);
      
      // Parse the conversation
      const conversation = parsePodcastConversation(conversationText);
      
      if (conversation.length === 0) {
        throw new Error('Failed to parse conversation from AI response');
      }
      
      // Get selected speaker voices
      const speaker1Voice = document.getElementById('speaker1-voice').value || 'Kore';
      const speaker2Voice = document.getElementById('speaker2-voice').value || 'Puck';
      
      // Configure speakers (exactly 2 as required by the API)
      const speakerConfig = {
        'Speaker 1': speaker1Voice,  // First speaker
        'Speaker 2': speaker2Voice   // Second speaker
      };
      
      // Generate podcast
      const wavBlob = await generatePodcast(conversation, 'podcast.wav', speakerConfig);
      
      // Update audio player
      const audioUrl = URL.createObjectURL(wavBlob);
      audioEl.src = audioUrl;
      
      // Show player
      playerEl.style.display = 'block';
      statusEl.textContent = `Podcast "${podcastTitle}" generated successfully!`;
      statusEl.className = 'status success';
      
      // Store for download
      this.currentPodcastBlob = wavBlob;
      this.currentPodcastName = `${podcastTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_podcast.wav`;
    } catch (error) {
      console.error('Error generating podcast from note:', error);
      statusEl.textContent = `Error: ${error.message}`;
      statusEl.className = 'status error';
    }
  }

  // This method is kept for backward compatibility but may not be used in the current UI
  async generatePodcast() {
    const statusEl = document.getElementById('podcast-status');
    const playerEl = document.getElementById('podcast-player');
    const audioEl = document.getElementById('podcast-audio');
    
    // Get form values
    const speaker1Voice = document.getElementById('speaker1-voice').value || 'Kore';
    const speaker2Voice = document.getElementById('speaker2-voice').value || 'Puck';
    
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
    statusEl.textContent = 'Generating podcast...';
    statusEl.className = 'status';
    playerEl.style.display = 'none';
    
    try {
      // Generate podcast
      const wavBlob = await generatePodcast(conversation, 'podcast.wav', speakerConfig);
      
      // Update audio player
      const audioUrl = URL.createObjectURL(wavBlob);
      audioEl.src = audioUrl;
      
      // Show player
      playerEl.style.display = 'block';
      statusEl.textContent = 'Podcast generated successfully!';
      statusEl.className = 'status success';
      
      // Store for download
      this.currentPodcastBlob = wavBlob;
      this.currentPodcastName = 'podcast.wav';
    } catch (error) {
      console.error('Error generating podcast:', error);
      statusEl.textContent = `Error: ${error.message}`;
      statusEl.className = 'status error';
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