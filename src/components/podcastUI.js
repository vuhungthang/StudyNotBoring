// podcastUI.js
import { generatePodcast, generatePodcastConversation, parsePodcastConversation } from '../components/podcastGenerator.js';
import UIComponents from './ui.js';

class PodcastUI {
  constructor() {
    this.container = null;
    this.isInitialized = false;
    this.notebooks = {};
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error("Container with id '" + containerId + "' not found");
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
      notebookOptions += '<option value="' + notebookName + '">' + notebookName + '</option>';
      
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
        noteOptions += '<option value="' + notebookName + '::' + note.id + '" data-content="' + escapedContent + '">' + notebookName + ' - ' + note.title + '</option>';
      });
    }

    this.container.innerHTML = 
      '<div class="podcast-studio">' +
        '<div class="podcast-header">' +
          '<h1>Podcast Studio</h1>' +
          '<p>Transform your notes into engaging audio conversations</p>' +
        '</div>' +
        
        '<div class="podcast-layout">' +
          '<!-- Main Content Area -->' +
          '<div class="podcast-main">' +
            '<!-- Generate Podcast Card -->' +
            '<div class="podcast-card">' +
              '<div class="card-header">' +
                '<h2>Generate from Note</h2>' +
                UIComponents.badge({ variant: "secondary", children: "AI-Powered" }) +
              '</div>' +
              
              '<div class="card-content">' +
                '<div class="form-group">' +
                  '<label for="note-select">Select a Note</label>' +
                  UIComponents.select({ id: "note-select", className: "form-select" }, noteOptions) +
                '</div>' +
                
                '<div class="form-group">' +
                  '<label for="podcast-title">Podcast Title</label>' +
                  UIComponents.input({ type: "text", id: "podcast-title", placeholder: "Enter a title for your podcast" }) +
                '</div>' +
                
                '<div class="advanced-settings">' +
                  '<div class="settings-header">' +
                    '<h3>Advanced Settings</h3>' +
                    '<button id="toggle-settings-btn" class="toggle-btn">' +
                      '<span>Expand</span>' +
                      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
                      '</svg>' +
                    '</button>' +
                  '</div>' +
                  
                  '<div id="podcast-settings" class="settings-content">' +
                    '<div class="voice-settings">' +
                      '<div class="voice-setting">' +
                        '<label for="speaker1-voice">Speaker 1 Voice</label>' +
                        UIComponents.select({ id: "speaker1-voice" }, 
                          '<option value="Kore">Kore (Firm)</option>' +
                          '<option value="Puck">Puck (Upbeat)</option>' +
                          '<option value="Charon">Charon (Informative)</option>' +
                          '<option value="Zephyr">Zephyr (Bright)</option>' +
                          '<option value="Fenrir">Fenrir (Excitable)</option>' +
                          '<option value="Leda">Leda (Youthful)</option>' +
                          '<option value="Orus">Orus (Firm)</option>' +
                          '<option value="Aoede">Aoede (Breezy)</option>' +
                          '<option value="Callirrhoe">Callirrhoe (Easy-going)</option>' +
                          '<option value="Autonoe">Autonoe (Bright)</option>' +
                          '<option value="Enceladus">Enceladus (Breathy)</option>' +
                          '<option value="Iapetus">Iapetus (Clear)</option>' +
                          '<option value="Umbriel">Umbriel (Easy-going)</option>' +
                          '<option value="Algieba">Algieba (Smooth)</option>' +
                          '<option value="Despina">Despina (Smooth)</option>' +
                          '<option value="Erinome">Erinome (Clear)</option>' +
                          '<option value="Algenib">Algenib (Gravelly)</option>' +
                          '<option value="Rasalgethi">Rasalgethi (Informative)</option>' +
                          '<option value="Laomedeia">Laomedeia (Upbeat)</option>' +
                          '<option value="Achernar">Achernar (Soft)</option>' +
                          '<option value="Alnilam">Alnilam (Firm)</option>' +
                          '<option value="Schedar">Schedar (Even)</option>' +
                          '<option value="Gacrux">Gacrux (Mature)</option>' +
                          '<option value="Pulcherrima">Pulcherrima (Forward)</option>' +
                          '<option value="Achird">Achird (Friendly)</option>' +
                          '<option value="Zubenelgenubi">Zubenelgenubi (Casual)</option>' +
                          '<option value="Vindemiatrix">Vindemiatrix (Gentle)</option>' +
                          '<option value="Sadachbia">Sadachbia (Lively)</option>' +
                          '<option value="Sadaltager">Sadaltager (Knowledgeable)</option>' +
                          '<option value="Sulafat">Sulafat (Warm)</option>'
                        ) +
                        '<p class="help-text">Select the voice for the first speaker</p>' +
                      '</div>' +
                      
                      '<div class="voice-setting">' +
                        '<label for="speaker2-voice">Speaker 2 Voice</label>' +
                        UIComponents.select({ id: "speaker2-voice" }, 
                          '<option value="Puck">Puck (Upbeat)</option>' +
                          '<option value="Kore">Kore (Firm)</option>' +
                          '<option value="Charon">Charon (Informative)</option>' +
                          '<option value="Zephyr">Zephyr (Bright)</option>' +
                          '<option value="Fenrir">Fenrir (Excitable)</option>' +
                          '<option value="Leda">Leda (Youthful)</option>' +
                          '<option value="Orus">Orus (Firm)</option>' +
                          '<option value="Aoede">Aoede (Breezy)</option>' +
                          '<option value="Callirrhoe">Callirrhoe (Easy-going)</option>' +
                          '<option value="Autonoe">Autonoe (Bright)</option>' +
                          '<option value="Enceladus">Enceladus (Breathy)</option>' +
                          '<option value="Iapetus">Iapetus (Clear)</option>' +
                          '<option value="Umbriel">Umbriel (Easy-going)</option>' +
                          '<option value="Algieba">Algieba (Smooth)</option>' +
                          '<option value="Despina">Despina (Smooth)</option>' +
                          '<option value="Erinome">Erinome (Clear)</option>' +
                          '<option value="Algenib">Algenib (Gravelly)</option>' +
                          '<option value="Rasalgethi">Rasalgethi (Informative)</option>' +
                          '<option value="Laomedeia">Laomedeia (Upbeat)</option>' +
                          '<option value="Achernar">Achernar (Soft)</option>' +
                          '<option value="Alnilam">Alnilam (Firm)</option>' +
                          '<option value="Schedar">Schedar (Even)</option>' +
                          '<option value="Gacrux">Gacrux (Mature)</option>' +
                          '<option value="Pulcherrima">Pulcherrima (Forward)</option>' +
                          '<option value="Achird">Achird (Friendly)</option>' +
                          '<option value="Zubenelgenubi">Zubenelgenubi (Casual)</option>' +
                          '<option value="Vindemiatrix">Vindemiatrix (Gentle)</option>' +
                          '<option value="Sadachbia">Sadachbia (Lively)</option>' +
                          '<option value="Sadaltager">Sadaltager (Knowledgeable)</option>' +
                          '<option value="Sulafat">Sulafat (Warm)</option>'
                        ) +
                        '<p class="help-text">Select the voice for the second speaker</p>' +
                      '</div>' +
                    '</div>' +
                    
                    UIComponents.alert({ variant: "default", className: "tip-alert", children: 
                      '<p><strong>Tip:</strong> Choose voices with different characteristics to create a more engaging conversation.</p>'
                    }) +
                  '</div>' +
                '</div>' +
                
                UIComponents.button({ id: "generate-from-note-btn", className: "generate-btn", children: "Generate Podcast" }) +
              '</div>' +
            '</div>' +
            
            '<!-- Recent Podcasts Card -->' +
            '<div class="podcast-card">' +
              '<div class="card-header">' +
                '<h2>Recent Podcasts</h2>' +
              '</div>' +
              
              '<div class="card-content">' +
                '<div class="recent-podcasts-list" id="recent-podcasts-list">' +
                  '<div class="empty-state">' +
                    '<p>No recent podcasts yet. Generate your first podcast to see it here!</p>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          
          '<!-- Sidebar -->' +
          '<div class="podcast-sidebar">' +
            '<!-- How It Works Card -->' +
            '<div class="podcast-card">' +
              '<div class="card-header">' +
                '<h2>How It Works</h2>' +
              '</div>' +
              
              '<div class="card-content">' +
                '<div class="steps">' +
                  '<div class="step">' +
                    '<div class="step-number">1</div>' +
                    '<p>Select a note from your notebook to convert into a podcast</p>' +
                  '</div>' +
                  
                  '<div class="step">' +
                    '<div class="step-number">2</div>' +
                    '<p>Our AI transforms your notes into a natural conversation</p>' +
                  '</div>' +
                  
                  '<div class="step">' +
                    '<div class="step-number">3</div>' +
                    '<p>Choose voices and generate your audio podcast</p>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            
            '<!-- Tips Card -->' +
            '<div class="podcast-card">' +
              '<div class="card-header">' +
                '<h2>Tips for Best Results</h2>' +
              '</div>' +
              
              '<div class="card-content">' +
                '<ul class="tips-list">' +
                  '<li><span>•</span><span>Use detailed, well-structured notes for better conversion</span></li>' +
                  '<li><span>•</span><span>Focus on one main topic per podcast for clarity</span></li>' +
                  '<li><span>•</span><span>Experiment with different voice combinations</span></li>' +
                '</ul>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        
        '<!-- Status and Player -->' +
        '<div class="podcast-footer">' +
          '<div id="podcast-status" class="status-message hidden"></div>' +
          '<div id="podcast-player" class="podcast-player hidden">' +
            '<div class="podcast-card">' +
              '<div class="card-content">' +
                '<div class="player-content">' +
                  '<h3>Your Podcast is Ready</h3>' +
                  '<p>Listen or download your generated podcast</p>' +
                  
                  '<div class="audio-player">' +
                    '<audio id="podcast-audio" controls></audio>' +
                    '<div class="player-controls">' +
                      UIComponents.button({ id: "play-btn", variant: "default", children: "Play" }) +
                      UIComponents.button({ id: "download-podcast-btn", variant: "secondary", children: "Download" }) +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

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
          playBtn.textContent = 'Pause';
        } else {
          audioEl.pause();
          playBtn.textContent = 'Play';
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
          toggleSettingsBtn.querySelector('span').textContent = 'Expand';
          toggleSettingsBtn.querySelector('svg').style.transform = 'rotate(0deg)';
        } else {
          podcastSettings.classList.remove('hidden');
          toggleSettingsBtn.querySelector('span').textContent = 'Collapse';
          toggleSettingsBtn.querySelector('svg').style.transform = 'rotate(180deg)';
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
      statusEl.className = 'status-message error';
      statusEl.classList.remove('hidden');
      return;
    }
    
    // Get note content
    const selectedOption = noteSelect.options[noteSelect.selectedIndex];
    const noteContent = selectedOption.getAttribute('data-content');
    
    if (!noteContent) {
      statusEl.textContent = 'Could not retrieve note content.';
      statusEl.className = 'status-message error';
      statusEl.classList.remove('hidden');
      return;
    }
    
    // Get podcast title
    const podcastTitle = podcastTitleInput.value.trim() || selectedOption.text.replace(/.* - /, '');
    
    // Update UI
    statusEl.textContent = 'Generating podcast from note...';
    statusEl.className = 'status-message';
    statusEl.classList.remove('hidden');
    playerEl.classList.add('hidden');
    
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
      playerEl.classList.remove('hidden');
      statusEl.textContent = 'Podcast "' + podcastTitle + '" generated successfully!';
      statusEl.className = 'status-message success';
      
      // Store for download
      this.currentPodcastBlob = wavBlob;
      this.currentPodcastName = podcastTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_podcast.wav';
    } catch (error) {
      console.error('Error generating podcast from note:', error);
      statusEl.textContent = 'Error: ' + error.message;
      statusEl.className = 'status-message error';
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
    statusEl.className = 'status-message';
    statusEl.classList.remove('hidden');
    playerEl.classList.add('hidden');
    
    try {
      // Generate podcast
      const wavBlob = await generatePodcast(conversation, 'podcast.wav', speakerConfig);
      
      // Update audio player
      const audioUrl = URL.createObjectURL(wavBlob);
      audioEl.src = audioUrl;
      
      // Show player
      playerEl.classList.remove('hidden');
      statusEl.textContent = 'Podcast generated successfully!';
      statusEl.className = 'status-message success';
      
      // Store for download
      this.currentPodcastBlob = wavBlob;
      this.currentPodcastName = 'podcast.wav';
    } catch (error) {
      console.error('Error generating podcast:', error);
      statusEl.textContent = 'Error: ' + error.message;
      statusEl.className = 'status-message error';
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