// script.js
import InfographicGenerator from './infographicGenerator.js';

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
        delete notebooks[name];
        saveNotebooksToLocalStorage();
        renderNotebooks();
        updateNotebookSelects();
        renderNotes();
        return true;
    }
    return false;
}

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
    renderNotes();
}

// Function to delete a note
function deleteNote(notebookName, noteId) {
    if (notebooks[notebookName]) {
        notebooks[notebookName] = notebooks[notebookName].filter(note => note.id !== noteId);
        saveNotebooksToLocalStorage();
        renderNotes();
    }
}

// Function to render notebooks
function renderNotebooks() {
    const notebooksContainer = document.getElementById('notebooks-container');
    notebooksContainer.innerHTML = '';
    
    for (const notebookName in notebooks) {
        const notebookElement = document.createElement('div');
        notebookElement.classList.add('notebook');
        notebookElement.innerHTML = `
            <h3>${notebookName}</h3>
            <button onclick="deleteNotebook('${notebookName}')">Delete</button>
        `;
        notebooksContainer.appendChild(notebookElement);
    }
}

// Function to update notebook selects
function updateNotebookSelects() {
    const selects = [
        document.getElementById('notebook-select'),
        document.getElementById('ai-notebook-select'),
        document.getElementById('filter-notebook-select')
    ];
    
    selects.forEach(select => {
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
        notesContainer.innerHTML = '<p class="no-notes">No notes found. Create your first note!</p>';
        return;
    }
    
    notesToDisplay.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        noteElement.innerHTML = `
            <h3>${note.title}</h3>
            <div class="note-meta">Created: ${note.timestamp}</div>
            <div class="note-content">${note.content}</div>
            <div class="note-actions">
                <button class="delete-btn" onclick="deleteNote('${selectedNotebook || getNotebookForNote(note.id)}', ${note.id})">Delete</button>
                <button class="infographic-btn" data-note-id="${note.id}">Create Infographic</button>
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
}

// Helper function to find which notebook a note belongs to
function getNotebookForNote(noteId) {
    for (const notebookName in notebooks) {
        if (notebooks[notebookName].some(note => note.id === noteId)) {
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

// Function to hide the API key form
function hideApiKeyForm() {
    const apiKeySection = document.querySelector('#api-key-form').closest('.settings-card');
    const form = document.getElementById('api-key-form');
    form.style.display = 'none';
    
    // Show the hide button
    const hideButton = document.getElementById('hide-api-key-form');
    hideButton.style.display = 'block';
}

// Function to show the API key form
function showApiKeyForm() {
    const apiKeySection = document.querySelector('#api-key-form').closest('.settings-card');
    const form = document.getElementById('api-key-form');
    form.style.display = 'block';
    
    // Hide the hide button
    const hideButton = document.getElementById('hide-api-key-form');
    hideButton.style.display = 'none';
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
        .replace(/```([\\s\\S]*?)```/g, '<pre><code>$1</code></pre>')
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
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(`${tabName}-section`).classList.add('active');
        });
    });
}

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

// Event listener for API key form submission
document.getElementById('api-key-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const apiKey = document.getElementById('api-key').value;
    saveApiKeyToLocalStorage(apiKey);
    alert('API Key saved successfully!');
    document.getElementById('api-key-form').reset();
    hideApiKeyForm();
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
    
    alert(`Model "${model}" selected successfully!`);
});

// Event listener for note form submission
document.getElementById('note-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const notebookSelect = document.getElementById('notebook-select');
    const notebookName = notebookSelect.value;
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;
    
    if (!notebookName) {
        alert('Please select a notebook.');
        return;
    }
    
    addNote(notebookName, title, content);
    document.getElementById('note-form').reset();
    
    // Switch to notes tab to see the new note
    document.querySelector('.nav-tab[data-tab="notes"]').click();
});

// Event listener for AI form submission
document.getElementById('ai-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const notebookSelect = document.getElementById('ai-notebook-select');
    const notebookName = notebookSelect.value;
    const prompt = document.getElementById('ai-prompt').value;
    const apiKey = loadApiKeyFromLocalStorage();
    
    if (!notebookName) {
        alert('Please select a notebook.');
        return;
    }
    
    if (!apiKey) {
        alert('Please enter your OpenRouter API key first.');
        showApiKeyForm();
        return;
    }
    
    // Show loading indicator
    document.getElementById('ai-submit-btn').style.display = 'none';
    document.getElementById('ai-loading').style.display = 'block';
    
    try {
        const aiNote = await generateNoteWithAI(prompt, apiKey, selectedModel);
        const formattedContent = formatAIContent(aiNote);
        addNote(notebookName, `AI: ${prompt}`, formattedContent);
        
        // Switch to notes tab to see the new note
        document.querySelector('.nav-tab[data-tab="notes"]').click();
    } catch (error) {
        console.error('Error generating note with AI:', error);
        alert(`Failed to generate note with AI: ${error.message}`);
    } finally {
        // Hide loading indicator
        document.getElementById('ai-submit-btn').style.display = 'block';
        document.getElementById('ai-loading').style.display = 'none';
    }
    
    document.getElementById('ai-form').reset();
});

// Event listener for filter notebook select
document.getElementById('filter-notebook-select').addEventListener('change', renderNotes);

// Load notebooks, API key, and selected model when the page loads
window.addEventListener('DOMContentLoaded', function() {
    setupTabNavigation();
    renderNotebooks();
    updateNotebookSelects();
    renderNotes();
    
    const savedApiKey = loadApiKeyFromLocalStorage();
    if (savedApiKey) {
        hideApiKeyForm();
    }
    
    // Set the selected model in the dropdown
    const modelSelect = document.getElementById('model-select');
    modelSelect.value = selectedModel;
    
    // If the selected model is not in the dropdown, set it as custom
    if (![...modelSelect.options].map(option => option.value).includes(selectedModel)) {
        document.getElementById('custom-model').value = selectedModel;
    }
    
    // Initialize infographic generator with current API key and model
    infographicGenerator = new InfographicGenerator();
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