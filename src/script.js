// script.js
import InfographicGenerator from './utils/infographicGenerator.js';
import noteGenerationPrompt from './utils/notePrompt.js';
import { getSynthesizedAudio, saveAudioAsWav, controlWebSpeechPlayback } from './lib/voice.js';
import PodcastUI from './components/podcastUI.js';
import UIComponents from './components/ui.js';

// Function to show loading overlay
function showLoading(message = "Processing...") {
  const overlay = document.getElementById('loading-overlay');
  const text = overlay.querySelector('.loading-text');
  text.textContent = message;
  overlay.classList.add('active');
}

// Function to hide loading overlay
function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.remove('active');
}

// Function to show notification
function showNotification(message, type = "success") {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  
  // Remove all type classes
  notification.classList.remove('success', 'error', 'warning');
  
  // Add the appropriate type class
  notification.classList.add(type);
  notification.classList.add('show');
  
  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

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
            showNotification(`Notebook "${name}" deleted successfully!`, "success");
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
        showNotification('Note deleted successfully!', "success");
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
            showNotification('Note deleted successfully!', "success");
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
        notebooksContainer.innerHTML = `
            <div class="no-notes col-span-full">
                <h3>No Notebooks Found</h3>
                <p>Create your first notebook to start organizing your notes.</p>
                ${UIComponents.button({ id: "create-first-notebook-btn", variant: "primary", children: "Create Your First Notebook" })}
            </div>
        `;
        
        // Add event listener to the create button
        document.getElementById('create-first-notebook-btn').addEventListener('click', function() {
            // Focus on the notebook creation input
            document.getElementById('new-notebook-name').focus();
            // Scroll to the creation form if needed
            document.getElementById('new-notebook-name').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        
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
                ${UIComponents.button({ className: "toggle-forms-btn btn btn-outline btn-sm", "data-notebook": name, children: "Add Note" })}
                ${UIComponents.button({ className: "delete-notebook-btn btn btn-destructive btn-sm", "data-notebook": name, children: "Delete" })}
            </div>
            <div class="notebook-forms-container" id="forms-${name}" style="display: none;">
                <div class="form-section">
                    <h4 class="form-section-title">Add New Note</h4>
                    <form class="note-form-inline space-y-2" data-notebook="${name}">
                        <div class="form-group">
                            ${UIComponents.label({ className: "form-label", children: "Title" })}
                            ${UIComponents.input({ type: "text", className: "note-title-inline form-input", placeholder: "Note Title", required: "required" })}
                        </div>
                        <div class="form-group">
                            ${UIComponents.label({ className: "form-label", children: "Content" })}
                            ${UIComponents.textarea({ className: "note-content-inline form-textarea", placeholder: "Note Content", required: "required", rows: "4" })}
                        </div>
                        ${UIComponents.button({ type: "submit", variant: "primary", className: "w-full", children: "Add Note" })}
                    </form>
                </div>
                
                <div class="form-section">
                    <h4 class="form-section-title">Generate Note with AI</h4>
                    <form class="ai-form-inline space-y-2" data-notebook="${name}">
                        <div class="form-group">
                            ${UIComponents.label({ className: "form-label", children: "AI Prompt" })}
                            ${UIComponents.input({ type: "text", className: "ai-prompt-inline form-input", placeholder: "Enter a topic or question (e.g., 'Explain photosynthesis', 'How do neural networks work?')", required: "required" })}
                        </div>
                        <div class="ai-info text-sm text-muted-foreground mb-2">
                            <strong>Enhanced formatting:</strong> AI will generate structured notes with headers, bullet points, and key concepts automatically.
                        </div>
                        ${UIComponents.button({ type: "submit", className: "ai-submit-btn-inline btn btn-primary w-full", children: "Generate Note" })}
                        <div class="ai-loading-inline text-center py-2 text-muted-foreground" style="display: none;">Generating...</div>
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
            showNotification('Note added successfully!', "success");
            
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
                showNotification('Please enter your OpenRouter API key first in Settings.', "error");
                // Switch to settings tab
                document.querySelector('.nav-tab[data-tab="settings"]').click();
                return;
            }
            
            // Show loading indicator
            submitBtn.style.display = 'none';
            loadingIndicator.style.display = 'block';
            
            try {
                showLoading("Generating AI Note...");
                const aiNote = await generateNoteWithAI(prompt, apiKey, selectedModel);
                const formattedContent = formatAIContent(aiNote);
                addNote(notebookName, `AI: ${prompt}`, formattedContent);
                this.reset();
                hideLoading();
                showNotification('AI Note generated successfully!', "success");
                
                // Hide the forms after submission
                const formsContainer = this.closest('.notebook-forms-container');
                if (formsContainer) {
                    formsContainer.style.display = 'none';
                }
            } catch (error) {
                console.error('Error generating note with AI:', error);
                hideLoading();
                showNotification(`Failed to generate note with AI: ${error.message}`, "error");
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
        const isFiltered = selectedNotebook && selectedNotebook !== "";
        notesContainer.innerHTML = `
            <div class="no-notes col-span-full">
                <h3>No Notes Found</h3>
                ${isFiltered 
                    ? `<p>This notebook doesn't have any notes yet. Create your first note!</p>`
                    : `<p>You don't have any notes yet. Create your first note or generate one with AI!</p>`
                }
                ${!isFiltered ? `
                    <div class="flex flex-wrap justify-center gap-3 mt-4">
                        ${UIComponents.button({ id: "create-first-note-btn", variant: "primary", children: "Create Note" })}
                        ${UIComponents.button({ id: "generate-first-ai-note-btn", variant: "secondary", children: "Generate AI Note" })}
                    </div>
                ` : `
                    ${UIComponents.button({ id: "create-first-note-in-notebook-btn", variant: "primary", className: "mt-4", children: "Create Note in This Notebook" })}
                `}
            </div>
        `;
        
        // Add event listeners to the buttons
        if (document.getElementById('create-first-note-btn')) {
            document.getElementById('create-first-note-btn').addEventListener('click', function() {
                // Switch to notebooks tab to create a note
                document.querySelector('.nav-tab[data-tab="notebooks"]').click();
            });
        }
        
        if (document.getElementById('generate-first-ai-note-btn')) {
            document.getElementById('generate-first-ai-note-btn').addEventListener('click', function() {
                // Switch to notebooks tab to generate an AI note
                document.querySelector('.nav-tab[data-tab="notebooks"]').click();
            });
        }
        
        if (document.getElementById('create-first-note-in-notebook-btn')) {
            document.getElementById('create-first-note-in-notebook-btn').addEventListener('click', function() {
                // Find the first notebook and show its forms
                const firstNotebookCard = document.querySelector('.notebook-simple-card');
                if (firstNotebookCard) {
                    // Switch to notebooks tab
                    document.querySelector('.nav-tab[data-tab="notebooks"]').click();
                    // Scroll to the notebook
                    firstNotebookCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Click the "Add Note" button
                    const addNoteBtn = firstNotebookCard.querySelector('.toggle-forms-btn');
                    if (addNoteBtn) {
                        addNoteBtn.click();
                    }
                }
            });
        }
        
        return;
    }
    
    notesToDisplay.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        // Determine the notebook name for this note
        const notebookName = selectedNotebook || getNotebookForNote(note.id) || '';
        noteElement.innerHTML = `
            <div class="note-header">
                <h3 class="note-title">${note.title}</h3>
                <div class="note-meta">Created: ${note.timestamp}</div>
            </div>
            <div class="note-content note-content-collapsed">${note.content}</div>
            <div class="note-actions">
                ${UIComponents.button({ className: "toggle-note-btn btn btn-outline", "data-note-id": note.id, children: "View" })}
                ${UIComponents.button({ className: "infographic-btn btn btn-outline", "data-note-id": note.id, children: "Infographic" })}
                ${UIComponents.button({ className: "listen-btn btn btn-primary", "data-note-id": note.id, children: "Listen" })}
                ${UIComponents.button({ className: "stop-btn btn btn-secondary", "data-note-id": note.id, style: "display: none;", children: "Stop" })}
                ${UIComponents.button({ className: "download-audio-btn btn btn-outline", "data-note-id": note.id, children: "Download" })}
                ${UIComponents.button({ variant: "destructive", onclick: `deleteNote('${notebookName}', ${note.id})`, children: "Delete" })}
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
                    showLoading("Generating Infographic...");
                    // Show loading indicator
                    this.textContent = 'Generating...';
                    this.disabled = true;
                    
                    // Generate infographic
                    const htmlContent = await infographicGenerator.generateInfographic(note.content);
                    
                    // Open in new window
                    infographicGenerator.openInfographicInNewWindow(htmlContent);
                    hideLoading();
                    showNotification('Infographic generated successfully!', "success");
                } catch (error) {
                    console.error('Error generating infographic:', error);
                    hideLoading();
                    showNotification(`Failed to generate infographic: ${error.message}`, "error");
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
            const noteId = parseInt(this.getAttribute('data-note-id'));
            const note = findNoteById(noteId);
            
            if (note) {
                // Show note in modal
                const modal = document.getElementById('note-modal');
                const modalTitle = document.getElementById('note-modal-title');
                const modalContent = document.getElementById('note-modal-content');
                
                modalTitle.textContent = note.title;
                modalContent.innerHTML = note.content;
                modal.classList.add('active');
            }
        });
    });
    
    // Add event listener for modal close button
    document.getElementById('note-modal-close').addEventListener('click', function() {
        const modal = document.getElementById('note-modal');
        modal.classList.remove('active');
    });
    
    // Add event listener for clicking outside the modal to close it
    document.getElementById('note-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
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
                showNotification('Please set your Gemini API key in Settings to listen to notes.', "error");
                return;
            }
            
            if (note) {
                try {
                    showLoading("Generating Audio...");
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
                                hideLoading();
                                showNotification('Error playing audio. Please check your browser console for more details.', "error");
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
                                        
                                        hideLoading();
                                        showNotification('Audio playback started!', "success");
                                        
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
                                        hideLoading();
                                        showNotification('Failed to play audio: ' + error.message, "error");
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
                            hideLoading();
                            showNotification('Failed to convert audio: ' + conversionError.message, "error");
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
                        hideLoading();
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
                    hideLoading();
                    showNotification(`Failed to play audio: ${error.message}`, "error");
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
                showNotification('Please set your Gemini API key in Settings to download audio.', "error");
                return;
            }
            
            if (note) {
                try {
                    showLoading("Generating Audio File...");
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
                        hideLoading();
                        showNotification('Audio file downloaded successfully!', "success");
                    } else {
                        // This code should never be reached since we're now throwing an error instead of using fallback
                        // If no audio data is returned, it means Web Speech API was used
                        // In this case, we can't save the audio
                        hideLoading();
                        showNotification('Audio was played using system speech synthesis and cannot be saved. Set a Gemini API key for downloadable audio.', "error");
                    }
                } catch (error) {
                    console.error('Error downloading audio:', error);
                    hideLoading();
                    showNotification(`Failed to download audio: ${error.message}`, "error");
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
        ${UIComponents.button({ className: "edit-api-btn mt-2 text-sm text-green-800 hover:text-green-900 underline", "data-api": "openrouter", children: "Edit API Key" })}
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
        ${UIComponents.button({ className: "edit-api-btn mt-2 text-sm text-green-800 hover:text-green-900 underline", "data-api": "gemini", children: "Edit API Key" })}
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
    const nav = document.querySelector('#dashboard-page .main-nav');
    
    if (!nav) {
        console.warn('Dashboard navigation element not found');
        return;
    }
    
    nav.addEventListener('click', (e) => {
        // Check if clicked element is a tab button with data-tab attribute
        const tabButton = e.target.closest('.nav-tab[data-tab]');
        if (tabButton) {
            e.preventDefault();
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('#dashboard-page .nav-tab[data-tab]').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('#dashboard-page .tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            tabButton.classList.add('active');
            
            // Show corresponding content
            const tabName = tabButton.getAttribute('data-tab');
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

// Set up tab navigation
document.addEventListener('DOMContentLoaded', function() {
    setupTabNavigation();
});

// Page navigation
document.addEventListener('DOMContentLoaded', function() {
    // Page navigation for main nav
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            
            // Update active page
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const targetPage = document.getElementById(`${page}-page`);
            if (targetPage) {
                targetPage.classList.add('active');
            }
            
            // Update active nav tab
            document.querySelectorAll('[data-page]').forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');
            
            // If navigating to dashboard, ensure the first tab is active
            if (page === 'dashboard') {
                // Remove active class from all dashboard tabs
                document.querySelectorAll('#dashboard-page .nav-tab[data-tab]').forEach(t => t.classList.remove('active'));
                // Add active class to first tab (notes)
                const firstTab = document.querySelector('#dashboard-page .nav-tab[data-tab="notes"]');
                if (firstTab) {
                    firstTab.classList.add('active');
                }
                // Show first tab content
                document.querySelectorAll('#dashboard-page .tab-content').forEach(content => content.classList.remove('active'));
                const firstTabContent = document.getElementById('notes-section');
                if (firstTabContent) {
                    firstTabContent.classList.add('active');
                }
            }
        });
    });
});

// Event listener for creating a new notebook
document.getElementById('create-notebook-btn').addEventListener('click', function() {
    const notebookNameInput = document.getElementById('new-notebook-name');
    const notebookName = notebookNameInput.value.trim();
    
    if (notebookName && createNotebook(notebookName)) {
        notebookNameInput.value = '';
        showNotification(`Notebook "${notebookName}" created successfully!`, "success");
    } else if (!notebookName) {
        showNotification('Please enter a notebook name.', "error");
    } else {
        showNotification('A notebook with this name already exists.', "error");
    }
});

// Event listeners for notebook search and sort
document.getElementById('search-notebooks')?.addEventListener('input', renderNotebooks);
document.getElementById('sort-notebooks')?.addEventListener('change', renderNotebooks);

// Event listener for API key form submission
document.getElementById('api-key-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading("Saving API Key...");
    const apiKey = document.getElementById('api-key').value;
    saveApiKeyToLocalStorage(apiKey);
    document.getElementById('api-key-form').reset();
    hideApiKeyForm();
    hideLoading();
    showNotification('OpenRouter API Key saved successfully!', "success");
});

// Event listener for Gemini API key form submission
document.getElementById('gemini-api-key-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading("Saving Gemini API Key...");
    const geminiApiKey = document.getElementById('gemini-api-key').value;
    localStorage.setItem('gemini-api-key', geminiApiKey);
    document.getElementById('gemini-api-key-form').reset();
    hideLoading();
    showNotification('Gemini API Key saved successfully!', "success");
});

// Event listener for hide API key form button
document.getElementById('hide-api-key-form').addEventListener('click', function(e) {
    e.preventDefault();
    showApiKeyForm();
});

// Event listener for model selection
document.getElementById('save-model-btn').addEventListener('click', function() {
    showLoading("Saving Model Selection...");
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
    
    hideLoading();
    showNotification(`Model "${model}" selected successfully!`, "success");
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
        ${UIComponents.button({ className: "edit-model-btn mt-2 text-sm text-blue-800 hover:text-blue-900 underline", "data-model": model, children: "Change Model" })}
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
        ${UIComponents.button({ className: "edit-model-btn mt-2 text-sm text-blue-800 hover:text-blue-900 underline", "data-model": model, children: "Change Model" })}
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

// Function to export notes as JSON
function exportNotes() {
    showLoading("Exporting Notes...");
    try {
        const dataStr = JSON.stringify(notebooks, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'study-not-boring-notes.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        hideLoading();
        showNotification('Notes exported successfully!', "success");
    } catch (error) {
        hideLoading();
        showNotification('Error exporting notes: ' + error.message, "error");
    }
}

// Function to import notes from JSON
function importNotes(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    showLoading("Importing Notes...");
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedNotebooks = JSON.parse(e.target.result);
            
            // Merge imported notebooks with existing ones
            let importedCount = 0;
            for (const notebookName in importedNotebooks) {
                if (notebooks[notebookName]) {
                    // If notebook exists, merge notes
                    const existingNoteIds = new Set(notebooks[notebookName].map(note => note.id));
                    for (const note of importedNotebooks[notebookName]) {
                        // Only add notes that don't already exist
                        if (!existingNoteIds.has(note.id)) {
                            notebooks[notebookName].push(note);
                            importedCount++;
                        }
                    }
                } else {
                    // If notebook doesn't exist, create it
                    notebooks[notebookName] = importedNotebooks[notebookName];
                    importedCount += importedNotebooks[notebookName].length;
                }
            }
            
            // Save to localStorage and refresh UI
            saveNotebooksToLocalStorage();
            renderNotebooks();
            updateNotebookSelects();
            renderNotes();
            
            hideLoading();
            showNotification(`Notes imported successfully! ${importedCount} new notes added.`, "success");
        } catch (error) {
            console.error('Error importing notes:', error);
            hideLoading();
            showNotification('Error importing notes. Please make sure the file is a valid JSON file.', "error");
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

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
    if (modelSelect) {
        modelSelect.value = savedModel;
    }
    
    // If the selected model is not in the dropdown, set it as custom
    const customModelInput = document.getElementById('custom-model');
    if (customModelInput && modelSelect) {
        if (![...modelSelect.options].map(option => option.value).includes(savedModel)) {
            customModelInput.value = savedModel;
        }
    }
    
    // Initialize infographic generator with current API key and model
    infographicGenerator = new InfographicGenerator();
    
    // Pre-fill Gemini API key if it exists
    if (savedGeminiKey && document.getElementById('gemini-api-key')) {
        document.getElementById('gemini-api-key').value = savedGeminiKey;
    }
    
    // Initialize podcast UI
    window.podcastUI = new PodcastUI();
    window.podcastUI.init('podcast-container');
    
    // Set up import/export event listeners
    const exportNotesBtn = document.getElementById('export-notes-btn');
    if (exportNotesBtn) {
        exportNotesBtn.addEventListener('click', exportNotes);
    }
    
    const importNotesBtn = document.getElementById('import-notes-btn');
    const importFileInput = document.getElementById('import-file-input');
    if (importNotesBtn && importFileInput) {
        importNotesBtn.addEventListener('click', function() {
            importFileInput.click();
        });
        importFileInput.addEventListener('change', importNotes);
    }
    
    // Add click event to hide notifications when clicked
    const notificationElement = document.getElementById('notification');
    if (notificationElement) {
        notificationElement.addEventListener('click', function() {
            this.classList.remove('show');
        });
    }
    
    // Ensure the first dashboard tab is active on initial load
    const dashboardPage = document.getElementById('dashboard-page');
    if (dashboardPage && dashboardPage.classList.contains('active')) {
        // Remove active class from all dashboard tabs
        document.querySelectorAll('#dashboard-page .nav-tab[data-tab]').forEach(t => t.classList.remove('active'));
        // Add active class to first tab (notes)
        const firstTab = document.querySelector('#dashboard-page .nav-tab[data-tab="notes"]');
        if (firstTab) {
            firstTab.classList.add('active');
        }
        // Show first tab content
        document.querySelectorAll('#dashboard-page .tab-content').forEach(content => content.classList.remove('active'));
        const firstTabContent = document.getElementById('notes-section');
        if (firstTabContent) {
            firstTabContent.classList.add('active');
        }
    }
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
                { role: "system", content: noteGenerationPrompt },
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
