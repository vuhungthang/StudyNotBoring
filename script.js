// script.js
import InfographicGenerator from './infographicGenerator.js';
import { getSynthesizedAudio, saveAudioAsWav, controlWebSpeechPlayback } from './voice.js';
import PodcastUI from './podcastUI.js';

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

// Data structure for notebooks and notes
let notebooks = JSON.parse(localStorage.getItem('notebooks')) || {};
let currentNotebook = null;

// Default AI model
let selectedModel = localStorage.getItem('selectedModel') || 'openrouter/auto';

// Infographic generator instance
let infographicGenerator = new InfographicGenerator();

// Function to save notebooks to local storage
function saveNotebooksToLocalStorage() {
    localStorage.setItem('notebooks', JSON.stringify(notebooks));
}

// Function to save selected model to local storage
function saveSelectedModelToLocalStorage(model) {
    localStorage.setItem('selectedModel', model);
}

// Function to create a new notebook
function createNotebook(name) {
    if (name && !notebooks[name]) {
        notebooks[name] = [];
        saveNotebooksToLocalStorage();
        renderNotebooks();
        updateNotebookSelects();
        return true;
    }
    return false;
}

// Function to delete a notebook
function deleteNotebook(name) {
    if (notebooks[name]) {
        const noteCount = notebooks[name].length;
        const message = `Are you sure you want to delete the notebook "${name}" and all its ${noteCount} note${noteCount !== 1 ? 's' : ''}? This action cannot be undone.`;
        
        if (confirm(message)) {
            delete notebooks[name];
            saveNotebooksToLocalStorage();
            renderNotebooks();
            updateNotebookSelects();
            renderNotes();
        }
        return true;
    }
    return false;
}

// Make the function globally accessible for onclick handlers
window.deleteNotebook = deleteNotebook;

// Function to add a new note
function addNote(notebookName, title, content) {
    if (!notebooks[notebookName]) {
        notebooks[notebookName] = [];
    }
    
    const note = {
        id: Date.now(),
        title: title,
        content: content,
        timestamp: new Date().toLocaleString()
    };
    
    notebooks[notebookName].push(note);
    saveNotebooksToLocalStorage();
    renderNotebooks(); // Update notebooks view as well
    renderNotes();
}

// Function to delete a note
function deleteNote(notebookName, noteId) {
    console.log('Deleting note:', notebookName, noteId);
    if (notebooks[notebookName]) {
        notebooks[notebookName] = notebooks[notebookName].filter(note => note.id !== noteId);
        saveNotebooksToLocalStorage();
        renderNotebooks(); // Update notebooks view as well
        renderNotes();
    } else {
        // If notebookName is not provided or invalid, try to find the note in any notebook
        let found = false;
        for (const nbName in notebooks) {
            const filteredNotes = notebooks[nbName].filter(note => note.id !== noteId);
            if (filteredNotes.length !== notebooks[nbName].length) {
                // Note was found and removed
                notebooks[nbName] = filteredNotes;
                found = true;
                break;
            }
        }
        if (found) {
            saveNotebooksToLocalStorage();
            renderNotebooks(); // Update notebooks view as well
            renderNotes();
        }
    }
}

// Make the function globally accessible for onclick handlers
window.deleteNote = deleteNote;

// Function to render notebooks
function renderNotebooks() {
    const notebooksContainer = document.getElementById('notebooks-container');
    const statsElement = document.getElementById('notebooks-stats');
    notebooksContainer.innerHTML = '';
    
    // Get search and sort values
    const searchValue = document.getElementById('search-notebooks')?.value.toLowerCase() || '';
    const sortValue = document.getElementById('sort-notebooks')?.value || 'name';
    
    // Convert notebooks to array for sorting
    let notebooksArray = Object.entries(notebooks).map(([name, notes]) => ({
        name,
        notes,
        noteCount: notes.length,
        lastModified: notes.length > 0 ? new Date(Math.max(...notes.map(note => new Date(note.timestamp)))) : new Date(0)
    }));
    
    // Filter notebooks based on search
    if (searchValue) {
        notebooksArray = notebooksArray.filter(nb => 
            nb.name.toLowerCase().includes(searchValue) || 
            nb.notes.some(note => 
                note.title.toLowerCase().includes(searchValue) || 
                note.content.toLowerCase().includes(searchValue)
            )
        );
    }
    
    // Sort notebooks
    switch (sortValue) {
        case 'name':
            notebooksArray.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'date':
            notebooksArray.sort((a, b) => b.lastModified - a.lastModified);
            break;
        case 'count':
            notebooksArray.sort((a, b) => b.noteCount - a.noteCount);
            break;
    }
    
    // Update stats
    const totalNotebooks = notebooksArray.length;
    const totalNotes = notebooksArray.reduce((sum, nb) => sum + nb.noteCount, 0);
    statsElement.textContent = `${totalNotebooks} notebook${totalNotebooks !== 1 ? 's' : ''}, ${totalNotes} note${totalNotes !== 1 ? 's' : ''}`;
    
    // Render notebooks
    if (notebooksArray.length === 0) {
        notebooksContainer.innerHTML = '<p class="no-notes col-span-full text-center py-12">No notebooks found. Create your first notebook!</p>';
        return;
    }
    
    notebooksArray.forEach(({ name, notes, noteCount }) => {
        const notebookElement = document.createElement('div');
        notebookElement.classList.add('notebook-simple-card');
        notebookElement.innerHTML = `
            <div class="notebook-card-header">
                <h3 class="notebook-card-title">${name}</h3>
                <span class="notebook-card-count">${noteCount}</span>
            </div>
            <div class="notebook-card-actions">
                <button class="btn btn-outline btn-sm toggle-forms-btn" data-notebook="${name}">Add Note</button>
                <button class="delete-notebook-btn btn btn-destructive btn-sm" data-notebook="${name}">Delete</button>
            </div>
            <div class="notebook-forms-container" id="forms-${name}" style="display: none;">
                <div class="form-section">
                    <h4 class="form-section-title">Add New Note</h4>
                    <form class="note-form-inline space-y-2" data-notebook="${name}">
                        <input type="text" class="note-title-inline form-input text-sm" placeholder="Note Title" required>
                        <textarea class="note-content-inline form-textarea text-sm" placeholder="Note Content" required rows="3"></textarea>
                        <button type="submit" class="btn btn-primary w-full text-sm">Add Note</button>
                    </form>
                </div>
                
                <div class="form-section">
                    <h4 class="form-section-title">Generate Note with AI</h4>
                    <form class="ai-form-inline space-y-2" data-notebook="${name}">
                        <input type="text" class="ai-prompt-inline form-input text-sm" placeholder="Enter a topic or question" required>
                        <button type="submit" class="ai-submit-btn-inline btn btn-primary w-full text-sm">Generate Note</button>
                        <div class="ai-loading-inline text-center py-2 text-muted-foreground text-sm" style="display: none;">Generating...</div>
                    </form>
                </div>
            </div>
        `;
        notebooksContainer.appendChild(notebookElement);
    });
    
    // Add click event to view notebook's notes (except on buttons and forms)
    document.querySelectorAll('.notebook-simple-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Check if the click was on a button or inside a form
            const isButton = e.target.closest('button');
            const isForm = e.target.closest('form');
            
            // Only switch to notes tab if not clicking on buttons or forms
            if (!isButton && !isForm) {
                const notebookName = this.querySelector('.notebook-card-title').textContent;
                // Set the filter to this notebook
                document.getElementById('filter-notebook-select').value = notebookName;
                // Switch to notes tab
                document.querySelector('.nav-tab[data-tab="notes"]').click();
                // Trigger the change event to update the notes display
                document.getElementById('filter-notebook-select').dispatchEvent(new Event('change'));
            }
        });
    });
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-notebook-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const notebookName = this.getAttribute('data-notebook');
            deleteNotebook(notebookName);
        });
    });
    
    // Add event listeners for toggle buttons
    document.querySelectorAll('.toggle-forms-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const notebookName = this.getAttribute('data-notebook');
            const formsContainer = document.getElementById(`forms-${notebookName}`);
            const isVisible = formsContainer.style.display === 'block';
            
            // Hide all forms first
            document.querySelectorAll('.notebook-forms-container').forEach(container => {
                container.style.display = 'none';
            });
            
            // Toggle the clicked form
            formsContainer.style.display = isVisible ? 'none' : 'block';
        });
    });
    
    // Add event listeners for inline note forms
    document.querySelectorAll('.note-form-inline').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const notebookName = this.getAttribute('data-notebook');
            const title = this.querySelector('.note-title-inline').value;
            const content = this.querySelector('.note-content-inline').value;
            
            addNote(notebookName, title, content);
            this.reset();
            
            // Hide the forms after submission
            const formsContainer = this.closest('.notebook-forms-container');
            if (formsContainer) {
                formsContainer.style.display = 'none';
            }
        });
    });
    
    // Add event listeners for inline AI forms
    document.querySelectorAll('.ai-form-inline').forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            const notebookName = this.getAttribute('data-notebook');
            const prompt = this.querySelector('.ai-prompt-inline').value;
            const apiKey = loadApiKeyFromLocalStorage();
            const submitBtn = this.querySelector('.ai-submit-btn-inline');
            const loadingIndicator = this.querySelector('.ai-loading-inline');
            
            if (!apiKey) {
                alert('Please enter your OpenRouter API key first in Settings.');
                // Switch to settings tab
                document.querySelector('.nav-tab[data-tab="settings"]').click();
                return;
            }
            
            // Show loading indicator
            submitBtn.style.display = 'none';
            loadingIndicator.style.display = 'block';
            
            try {
                const aiNote = await generateNoteWithAI(prompt, apiKey, selectedModel);
                const formattedContent = formatAIContent(aiNote);
                addNote(notebookName, `AI: ${prompt}`, formattedContent);
                this.reset();
                
                // Hide the forms after submission
                const formsContainer = this.closest('.notebook-forms-container');
                if (formsContainer) {
                    formsContainer.style.display = 'none';
                }
            } catch (error) {
                console.error('Error generating note with AI:', error);
                alert(`Failed to generate note with AI: ${error.message}`);
            } finally {
                // Hide loading indicator
                submitBtn.style.display = 'block';
                loadingIndicator.style.display = 'none';
            }
        });
    });
}

// Function to update notebook selects
function updateNotebookSelects() {
    const selects = [
        document.getElementById('notebook-select'),
        document.getElementById('ai-notebook-select'),
        document.getElementById('filter-notebook-select')
    ];
    
    selects.forEach(select => {
        // Check if select element exists before trying to modify it
        if (select) {
            // Clear existing options except the first one
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Add notebook options
            for (const notebookName in notebooks) {
                const option = document.createElement('option');
                option.value = notebookName;
                option.textContent = notebookName;
                select.appendChild(option);
            }
        }
    });
}

// Function to render notes
function renderNotes() {
    const notesContainer = document.getElementById('notes-container');
    const filterSelect = document.getElementById('filter-notebook-select');
    const selectedNotebook = filterSelect.value;
    
    notesContainer.innerHTML = '';
    
    let notesToDisplay = [];
    
    if (selectedNotebook) {
        // Display notes from selected notebook only
        notesToDisplay = notebooks[selectedNotebook] || [];
    } else {
        // Display all notes
        for (const notebookName in notebooks) {
            notesToDisplay = notesToDisplay.concat(notebooks[notebookName]);
        }
    }
    
    // Sort notes by timestamp (newest first)
    notesToDisplay.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (notesToDisplay.length === 0) {
        notesContainer.innerHTML = '<p class="no-notes col-span-full">No notes found. Create your first note!</p>';
        return;
    }
    
    notesToDisplay.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        // Determine the notebook name for this note
        const notebookName = selectedNotebook || getNotebookForNote(note.id) || '';
        noteElement.innerHTML = `
            <h3 class="text-xl font-semibold mb-2">${note.title}</h3>
            <div class="note-meta mb-3 text-sm text-muted-foreground">Created: ${note.timestamp}</div>
            <div class="note-content mb-4 note-content-collapsed">${note.content}</div>
            <div class="note-actions flex flex-wrap gap-2 justify-end">
                <button class="btn btn-outline toggle-note-btn" data-note-id="${note.id}">Expand</button>
                <button class="btn btn-destructive" onclick="deleteNote('${notebookName}', ${note.id})">Delete</button>
                <button class="btn btn-outline infographic-btn" data-note-id="${note.id}">Create Infographic</button>
                <button class="btn btn-primary listen-btn" data-note-id="${note.id}">Listen</button>
                <button class="btn btn-secondary stop-btn" data-note-id="${note.id}" style="display: none;">Stop</button>
                <button class="btn btn-outline download-audio-btn" data-note-id="${note.id}">Download Audio</button>
            </div>
        `;
        notesContainer.appendChild(noteElement);
    });
    
    // Add event listeners for infographic buttons
    document.querySelectorAll('.infographic-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const noteId = parseInt(this.getAttribute('data-note-id'));
            const note = findNoteById(noteId);
            
            if (note) {
                // Check if popups are blocked before proceeding
                if (isPopupBlocked()) {
                    showPopupBlockedMessage();
                    return;
                }
                
                try {
                    // Show loading indicator
                    this.textContent = 'Generating...';
                    this.disabled = true;
                    
                    // Generate infographic
                    const htmlContent = await infographicGenerator.generateInfographic(note.content);
                    
                    // Open in new window
                    infographicGenerator.openInfographicInNewWindow(htmlContent);
                } catch (error) {
                    console.error('Error generating infographic:', error);
                    // Show error in a more user-friendly way
                    alert(`Failed to generate infographic: ${error.message}\n\nPlease check:\n1. Your API key is valid\n2. Popups are not blocked by your browser\n3. You have a stable internet connection`);
                } finally {
                    // Restore button
                    this.textContent = 'Create Infographic';
                    this.disabled = false;
                }
            }
        });
    });
    
    // Add event listeners for toggle note buttons
    document.querySelectorAll('.toggle-note-btn').forEach(button => {
        button.addEventListener('click', function() {
            const noteElement = this.closest('.note');
            const contentElement = noteElement.querySelector('.note-content');
            
            if (contentElement.classList.contains('note-content-collapsed')) {
                // Expand the note
                contentElement.classList.remove('note-content-collapsed');
                this.textContent = 'Collapse';
            } else {
                // Collapse the note
                contentElement.classList.add('note-content-collapsed');
                this.textContent = 'Expand';
            }
        });
    });
    
    // Add event listeners for listen buttons
    document.querySelectorAll('.listen-btn').forEach(button => {
        button.addEventListener('click', async function() {
            console.log('Listen button clicked');
            const noteId = parseInt(this.getAttribute('data-note-id'));
            const note = findNoteById(noteId);
            const stopButton = this.parentNode.querySelector('.stop-btn');
            
            // Check if this is a pause/resume action
            if (this.classList.contains('playing')) {
                console.log('Toggle pause/resume');
                // Toggle between pause and resume
                if (this.textContent === 'Pause') {
                    // Pause the audio
                    console.log('Pausing audio');
                    controlWebSpeechPlayback('pause');
                    this.textContent = 'Resume';
                } else {
                    // Resume the audio
                    console.log('Resuming audio');
                    controlWebSpeechPlayback('resume');
                    this.textContent = 'Pause';
                }
                return;
            }
            
            // If another audio is playing, stop it first
            if (window.currentPlayingButton && window.currentPlayingButton !== this) {
                console.log('Stopping previous audio');
                // Stop the currently playing audio
                controlWebSpeechPlayback('stop');
                window.currentPlayingButton.classList.remove('playing');
                window.currentPlayingButton.textContent = 'Listen';
                // Hide stop button for the previous playing button
                const prevStopButton = window.currentPlayingButton.parentNode.querySelector('.stop-btn');
                if (prevStopButton) {
                    prevStopButton.style.display = 'none';
                }
                window.currentPlayingButton = null;
            }
            
            // Check if Gemini API key is set
            const geminiApiKey = localStorage.getItem('gemini-api-key');
            if (!geminiApiKey || geminiApiKey === 'YOUR_API_KEY') {
                                    // Without an API key, an error will be shown
                // So we won't show an error message here
            }
            
            if (note) {
                try {
                    // Show loading indicator
                    const originalText = this.textContent;
                    this.textContent = 'Loading...';
                    this.disabled = true;
                    
                    // Get synthesized audio
                    const audioResult = await getSynthesizedAudio(note.content);
                    
                    // Store reference to current button for later use
                    window.currentPlayingButton = this;
                    
                    // If we get audio data, create an audio element and play it
                    if (audioResult) {
                        console.log('Playing audio with audio element');
                        console.log('Audio MIME type:', audioResult.mimeType);
                        console.log('Audio data length:', audioResult.data.length);
                        
                        try {
                            // Convert PCM to WAV for browser compatibility
                            const wavBuffer = convertPcmToWav(audioResult.data);
                            const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                            const wavUrl = URL.createObjectURL(wavBlob);
                            
                            // Create audio element and play
                            const audio = new Audio(wavUrl);
                            
                            // Log audio element properties for debugging
                            console.log('Audio element created:', audio);
                            console.log('Audio element src length:', wavUrl?.length);
                            
                            // Check if the browser requires user interaction for audio playback
                            if (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined') {
                                console.log('Audio context is available');
                            } else {
                                console.log('Audio context is not available');
                            }
                            
                            // Add error handling for audio playback
                            audio.addEventListener('error', (e) => {
                                console.error('Audio playback error:', e);
                                console.error('Audio error code:', audio.error?.code);
                                console.error('Audio error message:', audio.error?.message);
                                alert('Error playing audio. Please check your browser console for more details.');
                                // Reset button state
                                this.classList.remove('playing');
                                this.textContent = originalText;
                                this.disabled = false;
                                if (stopButton) {
                                    stopButton.style.display = 'none';
                                }
                                if (window.currentPlayingButton === this) {
                                    window.currentPlayingButton = null;
                                }
                                // Clean up URL
                                URL.revokeObjectURL(wavUrl);
                            });
                            
                            // Try to play the audio
                            // Note: Browsers may require user interaction to play audio
                            const playPromise = audio.play();
                            
                            if (playPromise !== undefined) {
                                playPromise
                                    .then(() => {
                                        // Audio playback started successfully
                                        console.log('Audio playback started');
                                        console.log('Audio is playing:', !audio.paused);
                                        
                                        // Change button to pause state
                                        this.classList.add('playing');
                                        this.textContent = 'Pause';
                                        this.disabled = false;
                                        
                                        // Show stop button
                                        if (stopButton) {
                                            stopButton.style.display = 'inline-block';
                                        }
                                        
                                        // Reset button when audio finishes playing
                                        audio.addEventListener('ended', () => {
                                            console.log('Audio finished playing');
                                            this.classList.remove('playing');
                                            this.textContent = originalText;
                                            if (stopButton) {
                                                stopButton.style.display = 'none';
                                            }
                                            if (window.currentPlayingButton === this) {
                                                window.currentPlayingButton = null;
                                            }
                                            // Clean up URL
                                            URL.revokeObjectURL(wavUrl);
                                        });
                                        
                                        // Handle pause/resume for audio element
                                        audio.addEventListener('pause', () => {
                                            if (this.classList.contains('playing')) {
                                                this.textContent = 'Resume';
                                            }
                                        });
                                        
                                        audio.addEventListener('play', () => {
                                            if (this.classList.contains('playing')) {
                                                this.textContent = 'Pause';
                                            }
                                        });
                                    })
                                    .catch((error) => {
                                        console.error('Error playing audio:', error);
                                        console.error('Error name:', error.name);
                                        console.error('Error message:', error.message);
                                        alert('Failed to play audio: ' + error.message);
                                        // Reset button state
                                        this.classList.remove('playing');
                                        this.textContent = originalText;
                                        this.disabled = false;
                                        if (stopButton) {
                                            stopButton.style.display = 'none';
                                        }
                                        if (window.currentPlayingButton === this) {
                                            window.currentPlayingButton = null;
                                        }
                                        // Clean up URL
                                        URL.revokeObjectURL(wavUrl);
                                    });
                            }
                        } catch (conversionError) {
                            console.error('Error converting PCM to WAV:', conversionError);
                            alert('Failed to convert audio: ' + conversionError.message);
                            // Reset button state
                            this.classList.remove('playing');
                            this.textContent = originalText;
                            this.disabled = false;
                            if (stopButton) {
                                stopButton.style.display = 'none';
                            }
                            if (window.currentPlayingButton === this) {
                                window.currentPlayingButton = null;
                            }
                        }
                    } else {
                        // This code should never be reached since we're now throwing an error instead of using fallback
                        console.log('Playing audio with Web Speech API');
                        // If no audio data is returned, it means Web Speech API was used
                        // In this case, change button to pause state
                        this.classList.add('playing');
                        this.textContent = 'Pause';
                        this.disabled = false;
                        
                        // Show stop button
                        if (stopButton) {
                            stopButton.style.display = 'inline-block';
                        }
                        
                        // Set up a timer to check when speech ends
                        const checkSpeechStatus = () => {
                            if (!speechSynthesis.speaking) {
                                // Speech has ended
                                // This code should never be reached since we're now throwing an error instead of using fallback
                            console.log('Web Speech API finished');
                                this.classList.remove('playing');
                                this.textContent = originalText;
                                if (stopButton) {
                                    stopButton.style.display = 'none';
                                }
                                if (window.currentPlayingButton === this) {
                                    window.currentPlayingButton = null;
                                }
                            } else {
                                // Check again in 100ms
                                setTimeout(checkSpeechStatus, 100);
                            }
                        };
                        
                        // Start checking speech status
                        setTimeout(checkSpeechStatus, 100);
                    }
                } catch (error) {
                    console.error('Error playing audio:', error);
                    alert(`Failed to play audio: ${error.message}`);
                    this.textContent = 'Listen';
                    this.classList.remove('playing');
                    this.disabled = false;
                    if (stopButton) {
                        stopButton.style.display = 'none';
                    }
                    if (window.currentPlayingButton === this) {
                        window.currentPlayingButton = null;
                    }
                }
            }
        });
    });
    
    // Add event listeners for download audio buttons
    document.querySelectorAll('.download-audio-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const noteId = parseInt(this.getAttribute('data-note-id'));
            const note = findNoteById(noteId);
            
            // Check if Gemini API key is set
            const geminiApiKey = localStorage.getItem('gemini-api-key');
            if (!geminiApiKey || geminiApiKey === 'YOUR_API_KEY') {
                alert('Please set your Gemini API key in Settings to download audio.');
                return;
            }
            
            if (note) {
                try {
                    // Show loading indicator
                    const originalText = this.textContent;
                    this.textContent = 'Generating...';
                    this.disabled = true;
                    
                    // Get synthesized audio
                    const audioResult = await getSynthesizedAudio(note.content);
                    
                    // If we get audio data, save it as WAV
                    if (audioResult) {
                        const filename = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audio.wav`;
                        await saveAudioAsWav(audioResult.data, filename);
                    } else {
                        // This code should never be reached since we're now throwing an error instead of using fallback
                        // If no audio data is returned, it means Web Speech API was used
                        // In this case, we can't save the audio
                        alert('Audio was played using system speech synthesis and cannot be saved. Set a Gemini API key for downloadable audio.');
                    }
                } catch (error) {
                    console.error('Error downloading audio:', error);
                    alert(`Failed to download audio: ${error.message}`);
                } finally {
                    // Reset button
                    this.textContent = originalText;
                    this.disabled = false;
                }
            }
        });
    });
    
    // Set up stop button event listeners
    setupStopButtonEventListeners();
}

// Function to set up stop button event listeners
function setupStopButtonEventListeners() {
    console.log('Setting up stop button event listeners');
    const stopButtons = document.querySelectorAll('.stop-btn');
    console.log('Found stop buttons:', stopButtons.length);
    
    stopButtons.forEach(button => {
        console.log('Adding event listener to stop button');
        button.addEventListener('click', function() {
            console.log('Stop button clicked');
            const noteId = parseInt(this.getAttribute('data-note-id'));
            const listenButton = this.parentNode.querySelector('.listen-btn');
            
            // Stop the audio
            controlWebSpeechPlayback('stop');
            
            // Reset the listen button
            listenButton.classList.remove('playing');
            listenButton.textContent = 'Listen';
            
            // Hide the stop button
            this.style.display = 'none';
            
            // Clear the current playing button reference if it's this button
            if (window.currentPlayingButton === listenButton) {
                window.currentPlayingButton = null;
            }
        });
    });
}

// Helper function to find which notebook a note belongs to
function getNotebookForNote(noteId) {
    for (const notebookName in notebooks) {
        if (notebooks[notebookName] && notebooks[notebookName].some(note => note.id === noteId)) {
            return notebookName;
        }
    }
    return null;
}

// Helper function to find a note by its ID
function findNoteById(noteId) {
    for (const notebookName in notebooks) {
        const note = notebooks[notebookName].find(note => note.id === noteId);
        if (note) {
            return note;
        }
    }
    return null;
}

// Function to check if popups are blocked
function isPopupBlocked() {
    try {
        const newWindow = window.open('', '_blank');
        if (!newWindow) {
            return true; // Popup blocked
        }
        newWindow.close();
        return false; // Popup not blocked
    } catch (e) {
        return true; // Popup blocked
    }
}

// Function to show popup blocked message with instructions
function showPopupBlockedMessage() {
    alert(`Please enable popups for this site to use the infographic feature.
    
To enable popups:
1. Look for a popup blocker icon in your browser's address bar
2. Click on it and choose to always allow popups for this site
3. Alternatively, go to your browser settings and disable popup blocking for this site
4. Refresh the page and try again

After enabling popups, click the "Create Infographic" button again.`);
}

// Function to save API key to local storage
function saveApiKeyToLocalStorage(apiKey) {
    localStorage.setItem('openrouter-api-key', apiKey);
    // Update infographic generator with new API key
    if (infographicGenerator) {
        infographicGenerator.apiKey = apiKey;
    }
}

// Function to load API key from local storage
function loadApiKeyFromLocalStorage() {
    return localStorage.getItem('openrouter-api-key');
}

// Function to hide the API key form and show status
function hideApiKeyForm() {
    const openRouterForm = document.getElementById('api-key-form');
    const geminiForm = document.getElementById('gemini-api-key-form');
    const hideButton = document.getElementById('hide-api-key-form');
    
    // Check if we have saved API keys
    const openRouterKey = localStorage.getItem('openrouter-api-key');
    const geminiKey = localStorage.getItem('gemini-api-key');
    
    // Hide forms
    if (openRouterForm) openRouterForm.style.display = 'none';
    if (geminiForm) geminiForm.style.display = 'none';
    
    // Show status messages
    showApiStatus();
    
    // Show the hide button
    if (hideButton) hideButton.style.display = 'block';
}

// Function to show the API key form and hide status
function showApiKeyForm() {
    const openRouterForm = document.getElementById('api-key-form');
    const geminiForm = document.getElementById('gemini-api-key-form');
    const hideButton = document.getElementById('hide-api-key-form');
    const openRouterStatus = document.getElementById('openrouter-api-status');
    const geminiStatus = document.getElementById('gemini-api-status');
    
    // Show forms
    if (openRouterForm) openRouterForm.style.display = 'block';
    if (geminiForm) geminiForm.style.display = 'block';
    
    // Hide status messages
    if (openRouterStatus) openRouterStatus.style.display = 'none';
    if (geminiStatus) geminiStatus.style.display = 'none';
    
    // Hide the hide button
    if (hideButton) hideButton.style.display = 'none';
}

// Function to show API status messages
function showApiStatus() {
    const openRouterForm = document.getElementById('api-key-form');
    const geminiForm = document.getElementById('gemini-api-key-form');
    const openRouterKey = localStorage.getItem('openrouter-api-key');
    const geminiKey = localStorage.getItem('gemini-api-key');
    
    // Create or update OpenRouter API status
    let openRouterStatus = document.getElementById('openrouter-api-status');
    if (!openRouterStatus) {
        openRouterStatus = document.createElement('div');
        openRouterStatus.id = 'openrouter-api-status';
        openRouterStatus.className = 'api-status bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4';
        openRouterStatus.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>OpenRouter API key is saved</span>
            </div>
            <button class="edit-api-btn mt-2 text-sm text-green-800 hover:text-green-900 underline" data-api="openrouter">Edit API Key</button>
        `;
        openRouterForm.parentNode.insertBefore(openRouterStatus, openRouterForm);
    } else {
        openRouterStatus.style.display = 'block';
    }
    
    // Create or update Gemini API status
    let geminiStatus = document.getElementById('gemini-api-status');
    if (!geminiStatus) {
        geminiStatus = document.createElement('div');
        geminiStatus.id = 'gemini-api-status';
        geminiStatus.className = 'api-status bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4';
        geminiStatus.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>Gemini API key is saved</span>
            </div>
            <button class="edit-api-btn mt-2 text-sm text-green-800 hover:text-green-900 underline" data-api="gemini">Edit API Key</button>
        `;
        geminiForm.parentNode.insertBefore(geminiStatus, geminiForm);
    } else {
        geminiStatus.style.display = 'block';
    }
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-api-btn').forEach(button => {
        button.addEventListener('click', function() {
            showApiKeyForm();
        });
    });
}

// Function to format AI-generated content
function formatAIContent(content) {
    // Convert markdown-style headers to HTML headers
    let formattedContent = content
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Convert markdown-style bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Convert markdown-style code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Convert inline code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Convert markdown-style lists
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        .replace(/<li>(.*$)/g, '<ol><li>$1</li></ol>')
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/<li>(.*$)/g, '<ul><li>$1</li></ul>')
        // Convert line breaks to paragraphs
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.*)$/gm, '<p>$1</p>');
    
    // Fix nested lists
    formattedContent = formattedContent
        .replace(/<\/ol><ol>/g, '')
        .replace(/<\/ul><ul>/g, '');
    
    // Wrap content in a div for styling
    return `<div class="ai-content">${formattedContent}</div>`;
}

// Tab navigation
function setupTabNavigation() {
    // Use event delegation on the parent nav element
    const nav = document.querySelector('.main-nav');
    
    if (!nav) {
        console.warn('Navigation element not found');
        return;
    }
    
    nav.addEventListener('click', (e) => {
        // Check if clicked element is a tab button
        if (e.target.classList.contains('nav-tab')) {
            e.preventDefault();
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            e.target.classList.add('active');
            
            // Show corresponding content
            const tabName = e.target.getAttribute('data-tab');
            const targetContent = document.getElementById(`${tabName}-section`);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // If switching to podcast tab, refresh the podcast UI
                if (tabName === 'podcast' && typeof window.podcastUI !== 'undefined' && window.podcastUI.refresh) {
                    window.podcastUI.refresh();
                }
            }
        }
    });
}

// Set up tab navigation immediately
setupTabNavigation();

// Event listener for creating a new notebook
document.getElementById('create-notebook-btn').addEventListener('click', function() {
    const notebookNameInput = document.getElementById('new-notebook-name');
    const notebookName = notebookNameInput.value.trim();
    
    if (notebookName && createNotebook(notebookName)) {
        notebookNameInput.value = '';
        alert(`Notebook "${notebookName}" created successfully!`);
    } else if (!notebookName) {
        alert('Please enter a notebook name.');
    } else {
        alert('A notebook with this name already exists.');
    }
});

// Event listeners for notebook search and sort
document.getElementById('search-notebooks')?.addEventListener('input', renderNotebooks);
document.getElementById('sort-notebooks')?.addEventListener('change', renderNotebooks);

// Event listener for API key form submission
document.getElementById('api-key-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const apiKey = document.getElementById('api-key').value;
    saveApiKeyToLocalStorage(apiKey);
    alert('API Key saved successfully!');
    document.getElementById('api-key-form').reset();
    hideApiKeyForm();
});

// Event listener for Gemini API key form submission
document.getElementById('gemini-api-key-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const geminiApiKey = document.getElementById('gemini-api-key').value;
    localStorage.setItem('gemini-api-key', geminiApiKey);
    alert('Gemini API Key saved successfully!');
    document.getElementById('gemini-api-key-form').reset();
});

// Event listener for hide API key form button
document.getElementById('hide-api-key-form').addEventListener('click', function(e) {
    e.preventDefault();
    showApiKeyForm();
});

// Event listener for model selection
document.getElementById('save-model-btn').addEventListener('click', function() {
    const modelSelect = document.getElementById('model-select');
    const customModelInput = document.getElementById('custom-model');
    
    let model = modelSelect.value;
    
    // If custom model is provided, use it instead
    if (customModelInput.value.trim()) {
        model = customModelInput.value.trim();
    }
    
    selectedModel = model;
    saveSelectedModelToLocalStorage(model);
    
    // Update infographic generator with new model
    if (infographicGenerator) {
        infographicGenerator.selectedModel = model;
    }
    
    // Show model status
    showModelStatus(model);
    
    alert(`Model "${model}" selected successfully!`);
});

// Function to show model status
function showModelStatus(model) {
    const modelControls = document.querySelector('.model-controls');
    const saveModelBtn = document.getElementById('save-model-btn');
    
    // Create or update model status
    let modelStatus = document.getElementById('model-status');
    if (!modelStatus) {
        modelStatus = document.createElement('div');
        modelStatus.id = 'model-status';
        modelStatus.className = 'model-status bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4';
        modelStatus.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>Current model: <strong>${model}</strong></span>
            </div>
            <button class="edit-model-btn mt-2 text-sm text-blue-800 hover:text-blue-900 underline" data-model="${model}">Change Model</button>
        `;
        modelControls.parentNode.insertBefore(modelStatus, modelControls.nextSibling);
    } else {
        modelStatus.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>Current model: <strong>${model}</strong></span>
            </div>
            <button class="edit-model-btn mt-2 text-sm text-blue-800 hover:text-blue-900 underline" data-model="${model}">Change Model</button>
        `;
    }
    
    // Show model status and hide model controls and save button
    modelStatus.style.display = 'block';
    modelControls.style.display = 'none';
    saveModelBtn.style.display = 'none';
    
    // Remove any existing event listeners to avoid duplicates
    const newEditButton = modelStatus.querySelector('.edit-model-btn');
    newEditButton.addEventListener('click', function() {
        modelControls.style.display = 'block';
        saveModelBtn.style.display = 'block';
        modelStatus.style.display = 'none';
    });
}

// Event listeners for note forms are now handled inline within each notebook
// Event listeners for AI forms are now handled inline within each notebook

// Event listener for filter notebook select
document.getElementById('filter-notebook-select').addEventListener('change', renderNotes);

// Load notebooks, API key, and selected model when the page loads
window.addEventListener('DOMContentLoaded', function() {
    setupTabNavigation();
    renderNotebooks();
    updateNotebookSelects();
    renderNotes();
    
    const savedOpenRouterKey = loadApiKeyFromLocalStorage();
    const savedGeminiKey = localStorage.getItem('gemini-api-key');
    const savedModel = localStorage.getItem('selectedModel') || 'openrouter/auto';
    
    if (savedOpenRouterKey || savedGeminiKey) {
        hideApiKeyForm();
    }
    
    // Show model status if a model is saved
    if (savedModel) {
        showModelStatus(savedModel);
    }
    
    // Set the selected model in the dropdown
    const modelSelect = document.getElementById('model-select');
    modelSelect.value = savedModel;
    
    // If the selected model is not in the dropdown, set it as custom
    if (![...modelSelect.options].map(option => option.value).includes(savedModel)) {
        document.getElementById('custom-model').value = savedModel;
    }
    
    // Initialize infographic generator with current API key and model
    infographicGenerator = new InfographicGenerator();
    
    // Pre-fill Gemini API key if it exists
    if (savedGeminiKey) {
        document.getElementById('gemini-api-key').value = savedGeminiKey;
    }
    
    // Initialize podcast UI
    window.podcastUI = new PodcastUI();
    window.podcastUI.init('podcast-container');
});

// AI integration with OpenRouter
async function generateNoteWithAI(prompt, apiKey, model) {
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