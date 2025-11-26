// ============================================
// FOOTBALL AI ASSISTANT - MAIN APPLICATION
// ============================================

// DOM Elements
let elements = {};
let selectedAIProvider = 'deepseek'; // Cambiado a DeepSeek como predeterminado

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    attachEventListeners();
    setupTextareaAutoResize();
});

// Initialize DOM element references
function initializeElements() {
    elements = {
        // Primary Chat
        primaryChatMessages: document.getElementById('primaryChatMessages'),
        primaryChatInput: document.getElementById('primaryChatInput'),
        primarySendBtn: document.getElementById('primarySendBtn'),
        primaryTyping: document.getElementById('primaryTyping'),

        // Secondary Chat
        secondaryChatMessages: document.getElementById('secondaryChatMessages'),
        secondaryChatInput: document.getElementById('secondaryChatInput'),
        secondarySendBtn: document.getElementById('secondarySendBtn'),
        secondaryTyping: document.getElementById('secondaryTyping'),

        // AI Provider Buttons
        providerBtns: document.querySelectorAll('.provider-btn'),

        // API Status
        requestsUsed: document.getElementById('requestsUsed'),
        requestsLimit: document.getElementById('requestsLimit')
    };
}

// Attach event listeners
function attachEventListeners() {
    // Primary chat
    elements.primarySendBtn.addEventListener('click', handlePrimaryMessage);
    elements.primaryChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handlePrimaryMessage();
        }
    });

    // Secondary chat
    elements.secondarySendBtn.addEventListener('click', handleSecondaryMessage);
    elements.secondaryChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSecondaryMessage();
        }
    });

    // AI Provider selection
    elements.providerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.providerBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedAIProvider = btn.dataset.provider;
            showToast(`Proveedor cambiado a ${btn.dataset.provider === 'openai' ? 'OpenAI' : 'DeepSeek'}`, 'info');
        });
    });
}

// Setup textarea auto-resize
function setupTextareaAutoResize() {
    [elements.primaryChatInput, elements.secondaryChatInput].forEach(textarea => {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    });
}

// ============================================
// PRIMARY CHAT - API QUERIES
// ============================================

async function handlePrimaryMessage() {
    const message = elements.primaryChatInput.value.trim();

    if (!message) {
        showToast('Por favor escribe una consulta', 'warning');
        return;
    }

    // Add user message to chat
    addMessageToChat('primary', 'user', message);

    // Clear input
    elements.primaryChatInput.value = '';
    elements.primaryChatInput.style.height = 'auto';

    // Disable input while processing
    elements.primarySendBtn.disabled = true;
    elements.primaryChatInput.disabled = true;

    // Show typing indicator
    elements.primaryTyping.classList.remove('hidden');
    scrollToBottom('primary');

    try {
        // Process query with AI
        const queryData = await aiService.processUserQuery(message);

        // Execute Football API query
        const apiResponse = await aiService.executeFootballQuery(queryData.intent, queryData.entities);

        // Render response
        const renderedData = renderFootballData(apiResponse, queryData.intent);

        // Add assistant response to chat
        addMessageToChat('primary', 'assistant', `Aquí están los resultados para: "${message}"`, renderedData);

        // Enable secondary chat now that we have results
        elements.secondaryChatInput.disabled = false;
        elements.secondarySendBtn.disabled = false;

        showToast('Consulta exitosa', 'success');

    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('primary', 'assistant', `❌ Error: ${error.message}`);
        showToast('Error al procesar la consulta', 'error');
    } finally {
        // Hide typing indicator
        elements.primaryTyping.classList.add('hidden');

        // Re-enable input
        elements.primarySendBtn.disabled = false;
        elements.primaryChatInput.disabled = false;
        elements.primaryChatInput.focus();

        scrollToBottom('primary');
    }
}

// ============================================
// SECONDARY CHAT - AI ANALYSIS
// ============================================

async function handleSecondaryMessage() {
    const message = elements.secondaryChatInput.value.trim();

    if (!message) {
        showToast('Por favor escribe una pregunta', 'warning');
        return;
    }

    if (!aiService.lastAPIResponse) {
        showToast('Primero realiza una consulta en el chat principal', 'warning');
        return;
    }

    // Add user message to chat
    addMessageToChat('secondary', 'user', message);

    // Clear input
    elements.secondaryChatInput.value = '';
    elements.secondaryChatInput.style.height = 'auto';

    // Disable input while processing
    elements.secondarySendBtn.disabled = true;
    elements.secondaryChatInput.disabled = true;

    // Show typing indicator
    elements.secondaryTyping.classList.remove('hidden');
    scrollToBottom('secondary');

    try {
        // Analyze results with selected AI provider
        const analysis = await aiService.analyzeResults(message, selectedAIProvider);

        // Add assistant response to chat
        addMessageToChat('secondary', 'assistant', analysis);

        showToast(`Análisis completado con ${selectedAIProvider === 'openai' ? 'OpenAI' : 'DeepSeek'}`, 'success');

    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('secondary', 'assistant', `❌ Error: ${error.message}`);
        showToast('Error al analizar los resultados', 'error');
    } finally {
        // Hide typing indicator
        elements.secondaryTyping.classList.add('hidden');

        // Re-enable input
        elements.secondarySendBtn.disabled = false;
        elements.secondaryChatInput.disabled = false;
        elements.secondaryChatInput.focus();

        scrollToBottom('secondary');
    }
}

// ============================================
// CHAT UI HELPERS
// ============================================

function addMessageToChat(chatType, role, text, htmlContent = null) {
    const container = chatType === 'primary' ? elements.primaryChatMessages : elements.secondaryChatMessages;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : (chatType === 'primary' ? '🤖' : '🧠');

    const content = document.createElement('div');
    content.className = 'message-content';

    if (htmlContent) {
        // If HTML content is provided, use it
        const textP = document.createElement('p');
        textP.textContent = text;
        content.appendChild(textP);

        const htmlDiv = document.createElement('div');
        htmlDiv.innerHTML = htmlContent;
        content.appendChild(htmlDiv);
    } else {
        // Otherwise, just use text
        const textP = document.createElement('p');
        textP.textContent = text;
        content.appendChild(textP);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    container.appendChild(messageDiv);

    // Store in conversation history
    aiService.addToHistory(role, text);
}

function scrollToBottom(chatType) {
    const container = chatType === 'primary' ? elements.primaryChatMessages : elements.secondaryChatMessages;
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    }[type] || 'ℹ️';

    toast.innerHTML = `
        <span style="font-size: 1.25rem;">${icon}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 300ms reverse';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// ============================================
// INITIALIZATION
// ============================================

// Load API status on startup
window.addEventListener('load', async () => {
    try {
        // Try to get API status
        const statusData = await aiService.fetchFootballAPI('https://v3.football.api-sports.io/status');

        if (statusData.response && statusData.response.requests) {
            elements.requestsUsed.textContent = statusData.response.requests.current || 0;
            elements.requestsLimit.textContent = statusData.response.requests.limit_day || 100;
        }
    } catch (error) {
        console.warn('Could not load API status:', error);
        // Set default values
        elements.requestsUsed.textContent = '0';
        elements.requestsLimit.textContent = '100';
    }
});
