import infographicPrompt from './infographicPrompt.js';

class InfographicGenerator {
    constructor() {
        this.apiKey = localStorage.getItem('openrouter-api-key');
        this.selectedModel = localStorage.getItem('selectedModel') || 'openrouter/auto';
    }

    async generateInfographic(noteContent) {
        if (!this.apiKey) {
            throw new Error('API key not found. Please set your OpenRouter API key in Settings.');
        }

        const fullPrompt = `${infographicPrompt}${noteContent}`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.selectedModel,
                messages: [
                    { role: "user", content: fullPrompt }
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

    openInfographicInNewWindow(htmlContent) {
        // Create a new window with the infographic
        const newWindow = window.open('', '_blank');
        
        // Check if the window was successfully created
        if (!newWindow) {
            throw new Error('Failed to open new window. Please check if popups are blocked by your browser.');
        }
        
        try {
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            newWindow.focus();
            return newWindow;
        } catch (error) {
            throw new Error('Failed to write content to new window: ' + error.message);
        }
    }
}

export default InfographicGenerator;