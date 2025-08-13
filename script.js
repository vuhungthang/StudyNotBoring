// script.js

// Function to add a new note
function addNote(title, content) {
    const notesContainer = document.getElementById('notes-container');
    const noteElement = document.createElement('div');
    noteElement.classList.add('note');
    noteElement.innerHTML = `
        <h3>${title}</h3>
        <p>${content}</p>
        <button onclick="deleteNote(this)">Delete</button>
    `;
    notesContainer.appendChild(noteElement);
    saveNotesToLocalStorage();
}

// Function to delete a note
function deleteNote(button) {
    const noteElement = button.parentElement;
    noteElement.remove();
    saveNotesToLocalStorage();
}

// Function to save notes to local storage
function saveNotesToLocalStorage() {
    const notesContainer = document.getElementById('notes-container');
    const notes = notesContainer.innerHTML;
    localStorage.setItem('notes', notes);
}

// Function to load notes from local storage
function loadNotesFromLocalStorage() {
    const notesContainer = document.getElementById('notes-container');
    const notes = localStorage.getItem('notes');
    if (notes) {
        notesContainer.innerHTML = notes;
    }
}

// Function to save API key to local storage
function saveApiKeyToLocalStorage(apiKey) {
    localStorage.setItem('openrouter-api-key', apiKey);
}

// Function to load API key from local storage
function loadApiKeyFromLocalStorage() {
    return localStorage.getItem('openrouter-api-key');
}

// Function to hide the API key form
function hideApiKeyForm() {
    const apiKeySection = document.getElementById('api-key-section');
    apiKeySection.style.display = 'none';
}

// Function to show the API key form
function showApiKeyForm() {
    const apiKeySection = document.getElementById('api-key-section');
    apiKeySection.style.display = 'block';
}

// Event listener for API key form submission
document.getElementById('api-key-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const apiKey = document.getElementById('api-key').value;
    saveApiKeyToLocalStorage(apiKey);
    alert('API Key saved successfully!');
    document.getElementById('api-key-form').reset();
    hideApiKeyForm();
    
    // Show the hide button
    document.getElementById('hide-api-key-form').style.display = 'block';
});

// Event listener for hide API key form button
document.getElementById('hide-api-key-form').addEventListener('click', function(e) {
    e.preventDefault();
    showApiKeyForm();
    document.getElementById('hide-api-key-form').style.display = 'none';
});

// Event listener for note form submission
document.getElementById('note-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;
    addNote(title, content);
    document.getElementById('note-form').reset();
});

// Event listener for AI form submission
document.getElementById('ai-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const prompt = document.getElementById('ai-prompt').value;
    const apiKey = loadApiKeyFromLocalStorage();
    
    if (!apiKey) {
        alert('Please enter your OpenRouter API key first.');
        showApiKeyForm();
        return;
    }
    
    // Show loading indicator
    document.getElementById('ai-submit-btn').style.display = 'none';
    document.getElementById('ai-loading').style.display = 'block';
    
    try {
        const aiNote = await generateNoteWithAI(prompt, apiKey);
        addNote('AI Generated Note', aiNote);
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

// Load notes and API key when the page loads
window.addEventListener('DOMContentLoaded', function() {
    loadNotesFromLocalStorage();
    const savedApiKey = loadApiKeyFromLocalStorage();
    if (savedApiKey) {
        hideApiKeyForm();
        document.getElementById('hide-api-key-form').style.display = 'block';
    }
});

// AI integration with OpenRouter
async function generateNoteWithAI(prompt, apiKey) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "openrouter/auto", // Using auto model selection
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