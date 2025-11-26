// ============================================
// DASHBOARD JAVASCRIPT
// ============================================

let currentUser = null;
let currentProfile = null;
let currentSessionId = null;
let chatHistory = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Require authentication
    currentUser = await requireAuth();
    if (!currentUser) return;

    // Load user profile
    await loadUserProfile();

    // Initialize UI
    initializeUI();

    // Load chat history
    await loadChatHistory();

    // Start new session
    startNewSession();
});

// ============================================
// USER PROFILE
// ============================================

async function loadUserProfile() {
    try {
        currentProfile = await getCurrentProfile();

        if (currentProfile) {
            // Update UI with user info
            document.getElementById('userEmail').textContent = currentProfile.email;
            document.getElementById('tokenBalance').textContent = currentProfile.token_balance;

            // Set user initials
            const initials = currentProfile.email.charAt(0).toUpperCase();
            document.getElementById('userInitials').textContent = initials;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error al cargar perfil', 'error');
    }
}

async function updateTokenBalance() {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('token_balance')
            .eq('id', currentUser.id)
            .single();

        if (error) throw error;

        if (data) {
            currentProfile.token_balance = data.token_balance;
            document.getElementById('tokenBalance').textContent = data.token_balance;
        }
    } catch (error) {
        console.error('Error updating token balance:', error);
    }
}

// ============================================
// UI INITIALIZATION
// ============================================

function initializeUI() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const suggestionCards = document.querySelectorAll('.suggestion-card');

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
    });

    // Send message on Enter (Shift+Enter for new line)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Send button click
    sendBtn.addEventListener('click', sendMessage);

    // New chat button
    newChatBtn.addEventListener('click', startNewSession);

    // Logout button
    logoutBtn.addEventListener('click', logout);

    // Suggestion cards
    suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            const query = card.dataset.query;
            chatInput.value = query;
            sendMessage();
        });
    });
}

// ============================================
// CHAT FUNCTIONALITY
// ============================================

function startNewSession() {
    currentSessionId = generateSessionId();
    chatHistory = [];

    // Clear chat messages
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    chatMessages.classList.add('hidden');

    // Show welcome screen
    document.getElementById('welcomeScreen').classList.remove('hidden');

    // Clear input
    document.getElementById('chatInput').value = '';

    // Focus input
    document.getElementById('chatInput').focus();
}

function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message) return;

    // Check token balance
    if (currentProfile.token_balance < 5) {
        showToast('No tienes suficientes tokens. Contacta al administrador.', 'warning');
        return;
    }

    // Hide welcome screen, show chat
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('chatMessages').classList.remove('hidden');

    // Add user message to chat
    addMessageToChat('user', message);

    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Show typing indicator
    document.getElementById('typingIndicator').classList.remove('hidden');
    scrollToBottom();

    try {
        const startTime = Date.now();

        // Process query with AI service
        const queryData = await aiService.processUserQuery(message);

        // Execute Football API query
        const apiResponse = await aiService.executeFootballQuery(queryData.intent, queryData.entities);

        const responseTime = Date.now() - startTime;

        // Render response
        const renderedData = renderFootballData(apiResponse, queryData.intent);

        // Add assistant response to chat
        addMessageToChat('assistant', `Aquí están los resultados para: "${message}"`, renderedData);

        // Save query to Supabase
        await saveQuery(message, queryData, apiResponse, responseTime);

        // Update token balance
        await updateTokenBalance();

        showToast('Consulta exitosa', 'success');

    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('assistant', `❌ Error: ${error.message}`);
        showToast('Error al procesar la consulta', 'error');
    } finally {
        // Hide typing indicator
        document.getElementById('typingIndicator').classList.add('hidden');
    }
}

function addMessageToChat(role, content, htmlContent = null) {
    const chatMessages = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (htmlContent) {
        contentDiv.innerHTML = `<p>${content}</p>${htmlContent}`;
    } else {
        contentDiv.innerHTML = `<p>${content}</p>`;
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    chatMessages.appendChild(messageDiv);

    // Add to history
    chatHistory.push({
        role,
        content,
        timestamp: new Date()
    });

    scrollToBottom();
}

function scrollToBottom() {
    const chatArea = document.querySelector('.chat-area');
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ============================================
// SUPABASE INTEGRATION
// ============================================

async function saveQuery(queryText, queryData, apiResponse, responseTime) {
    try {
        const { data, error } = await supabaseClient
            .rpc('consume_tokens', {
                p_user_id: currentUser.id,
                p_tokens: 5,
                p_query_text: queryText,
                p_intent: queryData.intent,
                p_entities: queryData.entities,
                p_response_data: apiResponse,
                p_response_time_ms: responseTime
            });

        if (error) throw error;

        if (!data.success) {
            throw new Error(data.error || 'Error al guardar query');
        }

        console.log('Query saved:', data);

    } catch (error) {
        console.error('Error saving query:', error);
        // Don't show error to user, just log it
    }
}

async function loadChatHistory() {
    try {
        const { data, error } = await supabaseClient
            .from('queries')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        if (data && data.length > 0) {
            renderHistoryList(data);
        }

    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function renderHistoryList(queries) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    // Group queries by date
    const groupedQueries = groupQueriesByDate(queries);

    Object.keys(groupedQueries).forEach(date => {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'history-date-group';

        const dateLabel = document.createElement('div');
        dateLabel.className = 'history-date-label';
        dateLabel.textContent = date;
        dateGroup.appendChild(dateLabel);

        groupedQueries[date].forEach(query => {
            const item = createHistoryItem(query);
            dateGroup.appendChild(item);
        });

        historyList.appendChild(dateGroup);
    });
}

function createHistoryItem(query) {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.dataset.queryId = query.id;

    const title = document.createElement('div');
    title.className = 'history-item-title';
    title.textContent = query.query_text;

    const date = document.createElement('div');
    date.className = 'history-item-date';
    date.textContent = formatRelativeTime(query.created_at);

    item.appendChild(title);
    item.appendChild(date);

    item.addEventListener('click', () => loadQuery(query));

    return item;
}

function groupQueriesByDate(queries) {
    const groups = {};

    queries.forEach(query => {
        const date = new Date(query.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let label;
        if (date.toDateString() === today.toDateString()) {
            label = 'Hoy';
        } else if (date.toDateString() === yesterday.toDateString()) {
            label = 'Ayer';
        } else {
            label = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        }

        if (!groups[label]) {
            groups[label] = [];
        }
        groups[label].push(query);
    });

    return groups;
}

function formatRelativeTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
}

async function loadQuery(query) {
    // TODO: Implement loading previous query
    console.log('Load query:', query);
    showToast('Función en desarrollo', 'info');
}

// ============================================
// API STATUS
// ============================================

async function loadAPIStatus() {
    try {
        const url = `${FOOTBALL_API_CONFIG.baseURL}/status`;
        const data = await aiService.fetchFootballAPI(url);

        if (data.response) {
            const requests = data.response.requests;
            document.getElementById('requestsUsed').textContent = requests.current;
            document.getElementById('requestsLimit').textContent = requests.limit_day;
        }
    } catch (error) {
        console.error('Could not load API status:', error);
    }
}

// Load API status on init
loadAPIStatus();
