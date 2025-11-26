require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Keys from environment variables
const AI_CONFIG = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo'
    },
    deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY,
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat'
    }
};

// Football API Configuration from environment variables
const FOOTBALL_API_CONFIG = {
    baseURL: process.env.RAPIDAPI_FOOTBALL_BASE_URL || 'https://api-football-v1.p.rapidapi.com/v3',
    apiKey: process.env.RAPIDAPI_FOOTBALL_API_KEY,
    rapidApiHost: process.env.RAPIDAPI_FOOTBALL_HOST || 'api-football-v1.p.rapidapi.com'
};

// Proxy endpoint for AI calls
app.post('/api/ai/:provider', async (req, res) => {
    const provider = req.params.provider;
    const { messages, temperature, max_tokens } = req.body;

    if (!AI_CONFIG[provider]) {
        return res.status(400).json({ error: 'Invalid AI provider' });
    }

    const config = AI_CONFIG[provider];

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Error calling AI API:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for Football API calls
app.get('/api/football/*', async (req, res) => {
    // Extract path and query string from the request
    const fullPath = req.path.replace('/api/football/', '');
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
    const url = `${FOOTBALL_API_CONFIG.baseURL}/${fullPath}${queryString ? '?' + queryString : ''}`;

    if (!FOOTBALL_API_CONFIG.apiKey) {
        return res.status(500).json({ error: 'Football API key not configured' });
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': FOOTBALL_API_CONFIG.apiKey,
                'x-rapidapi-host': FOOTBALL_API_CONFIG.rapidApiHost
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Error calling Football API:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Football AI Assistant Proxy Server' });
});

app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📡 Ready to handle AI requests`);
});
