// ============================================
// SIMPLIFIED AI SERVICE - NO AI REQUIRED
// ============================================

// Football API Configuration - Now using proxy server
const FOOTBALL_API_CONFIG = {
    baseURL: 'http://localhost:3000/api/football', // Proxy endpoint
    // API key and host are now handled by the server proxy
};

// ============================================
// SIMPLE QUERY PARSER (NO AI NEEDED)
// ============================================

class AIService {
    constructor() {
        this.conversationHistory = [];
        this.lastAPIResponse = null;
    }

    /**
     * Process user query using simple pattern matching (no AI)
     */
    async processUserQuery(userMessage) {
        try {
            const query = userMessage.toLowerCase().trim();
            const parsedResponse = this.parseQuery(query);

            if (parsedResponse.needsSearch) {
                await this.resolveEntities(parsedResponse.entities);
            }

            return parsedResponse;
        } catch (error) {
            console.error('Error processing query:', error);
            throw new Error('No pude procesar tu consulta. Intenta con: "partidos de [equipo]", "clasificacion de [liga]", "goleadores de [liga]"');
        }
    }

    /**
     * Simple pattern matching parser
     */
    parseQuery(query) {
        const result = {
            intent: null,
            entities: {},
            needsSearch: false
        };

        // Detect intent
        if (query.includes('partido') || query.includes('fixture') || query.includes('match')) {
            result.intent = 'fixtures';
            result.needsSearch = true;
        } else if (query.includes('clasificacion') || query.includes('tabla') || query.includes('standing')) {
            result.intent = 'standings';
            result.needsSearch = true;
        } else if (query.includes('goleador') || query.includes('scorer') || query.includes('top')) {
            result.intent = 'topscorers';
            result.needsSearch = true;
        } else if (query.includes('vivo') || query.includes('live') || query.includes('en directo')) {
            result.intent = 'live';
            result.needsSearch = false;
        } else {
            // Default to fixtures
            result.intent = 'fixtures';
            result.needsSearch = true;
        }

        // Extract entities using simple patterns
        // Extract team name (after "de", "del", "de la")
        const teamMatch = query.match(/(?:de|del|de la)\s+([a-záéíóúñ\s]+?)(?:\s|$)/i);
        if (teamMatch) {
            result.entities.team = teamMatch[1].trim();
        }

        // Extract league name
        const leaguePatterns = [
            /premier\s*league/i,
            /la\s*liga/i,
            /serie\s*a/i,
            /bundesliga/i,
            /ligue\s*1/i,
            /champions\s*league/i,
            /liga\s*mx/i,
            /liga\s*colombiana/i
        ];

        for (const pattern of leaguePatterns) {
            const match = query.match(pattern);
            if (match) {
                result.entities.league = match[0];
                break;
            }
        }

        // Set current season
        result.entities.season = new Date().getFullYear();

        return result;
    }

    /**
     * Analyze results with simple text response (no AI)
     */
    async analyzeResults(userQuestion) {
        if (!this.lastAPIResponse) {
            throw new Error('No hay resultados previos para analizar.');
        }

        // Simple analysis based on data
        const data = this.lastAPIResponse;
        let analysis = "Análisis de los resultados:\n\n";

        if (data.response && data.response.length > 0) {
            analysis += `Se encontraron ${data.response.length} resultados.\n\n`;

            // Add simple insights based on the data type
            if (data.response[0].fixture) {
                analysis += "📊 Partidos encontrados. Puedes ver los equipos, fechas y resultados arriba.";
            } else if (data.response[0].rank) {
                analysis += "📊 Tabla de clasificación. Los equipos están ordenados por puntos.";
            } else if (data.response[0].player) {
                analysis += "⚽ Lista de goleadores. Los jugadores están ordenados por número de goles.";
            }
        } else {
            analysis += "No se encontraron resultados para esta consulta.";
        }

        return analysis;
    }

    async resolveEntities(entities) {
        if (entities.team) {
            const teamId = await this.searchTeam(entities.team);
            if (teamId) {
                entities.teamId = teamId;
            }
        }

        if (entities.league) {
            const leagueId = await this.searchLeague(entities.league);
            if (leagueId) {
                entities.leagueId = leagueId;
            }
        }

        if (!entities.season) {
            entities.season = new Date().getFullYear();
        }

        return entities;
    }

    async searchTeam(teamName) {
        try {
            const url = `${FOOTBALL_API_CONFIG.baseURL}/teams?search=${encodeURIComponent(teamName)}`;
            const data = await this.fetchFootballAPI(url);

            if (data.response && data.response.length > 0) {
                return data.response[0].team.id;
            }
            return null;
        } catch (error) {
            console.error('Error searching team:', error);
            return null;
        }
    }

    async searchLeague(leagueName) {
        try {
            const url = `${FOOTBALL_API_CONFIG.baseURL}/leagues?search=${encodeURIComponent(leagueName)}`;
            const data = await this.fetchFootballAPI(url);

            if (data.response && data.response.length > 0) {
                return data.response[0].league.id;
            }
            return null;
        } catch (error) {
            console.error('Error searching league:', error);
            return null;
        }
    }

    async executeFootballQuery(intent, entities) {
        let endpoint = '';
        let params = new URLSearchParams();

        switch (intent) {
            case 'fixtures':
                endpoint = 'fixtures';
                if (entities.teamId) params.append('team', entities.teamId);
                if (entities.leagueId) params.append('league', entities.leagueId);
                if (entities.season) params.append('season', entities.season);
                if (!entities.teamId && !entities.leagueId) {
                    params.append('last', '20'); // Show last 20 fixtures by default
                } else {
                    params.append('last', '10');
                }
                break;

            case 'standings':
                endpoint = 'standings';
                if (entities.leagueId) params.append('league', entities.leagueId);
                if (entities.season) params.append('season', entities.season);
                break;

            case 'topscorers':
                endpoint = 'players/topscorers';
                if (entities.leagueId) params.append('league', entities.leagueId);
                if (entities.season) params.append('season', entities.season);
                break;

            case 'live':
                endpoint = 'fixtures';
                params.append('live', 'all');
                break;

            default:
                throw new Error(`Intent no soportado: ${intent}`);
        }

        const url = `${FOOTBALL_API_CONFIG.baseURL}/${endpoint}?${params.toString()}`;
        const data = await this.fetchFootballAPI(url);

        this.lastAPIResponse = data;

        return data;
    }

    async fetchFootballAPI(url) {
        // URLs are already constructed with the proxy baseURL, so use them directly
        // If an old RapidAPI URL is passed, convert it to proxy URL
        let proxyUrl = url;
        if (url.startsWith('https://api-football-v1.p.rapidapi.com/v3/')) {
            const path = url.replace('https://api-football-v1.p.rapidapi.com/v3/', '');
            proxyUrl = `${FOOTBALL_API_CONFIG.baseURL}/${path}`;
        }

        try {
            const response = await fetch(proxyUrl, {
                method: 'GET',
                // Headers (API key) are now handled by the server proxy for security
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error de API-Football: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            if (data.errors && Object.keys(data.errors).length > 0) {
                throw new Error(JSON.stringify(data.errors));
            }

            return data;
        } catch (error) {
            console.error('Error fetching from Football API:', error);
            throw error;
        }
    }

    addToHistory(role, content) {
        this.conversationHistory.push({ role, content, timestamp: new Date() });
    }

    clearHistory() {
        this.conversationHistory = [];
        this.lastAPIResponse = null;
    }
}

const aiService = new AIService();
