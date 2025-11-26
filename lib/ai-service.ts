// ============================================
// SIMPLIFIED AI SERVICE - NO AI REQUIRED
// ============================================

// Football API Configuration - Now using Next.js API routes
const FOOTBALL_API_CONFIG = {
  baseURL: '/api/football', // Next.js API route
};

interface QueryResult {
  intent: string | null;
  entities: {
    team?: string;
    teamId?: number;
    league?: string;
    leagueId?: number;
    season?: number;
  };
  needsSearch: boolean;
}

class AIService {
  conversationHistory: Array<{ role: string; content: string; timestamp: Date }>;
  lastAPIResponse: any;

  constructor() {
    this.conversationHistory = [];
    this.lastAPIResponse = null;
  }

  /**
   * Process user query using simple pattern matching (no AI)
   */
  async processUserQuery(userMessage: string): Promise<QueryResult> {
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
  parseQuery(query: string): QueryResult {
    const result: QueryResult = {
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
  async analyzeResults(userQuestion: string): Promise<string> {
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

  async resolveEntities(entities: QueryResult['entities']) {
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

  async searchTeam(teamName: string): Promise<number | null> {
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

  async searchLeague(leagueName: string): Promise<number | null> {
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

  async executeFootballQuery(intent: string | null, entities: QueryResult['entities']) {
    if (!intent) {
      throw new Error('Intent es requerido para ejecutar la consulta')
    }
    let endpoint = '';
    const params = new URLSearchParams();

    switch (intent) {
      case 'fixtures':
        endpoint = 'fixtures';
        if (entities.teamId) params.append('team', entities.teamId.toString());
        if (entities.leagueId) params.append('league', entities.leagueId.toString());
        if (entities.season) params.append('season', entities.season.toString());
        if (!entities.teamId && !entities.leagueId) {
          params.append('last', '20'); // Show last 20 fixtures by default
        } else {
          params.append('last', '10');
        }
        break;

      case 'standings':
        endpoint = 'standings';
        if (entities.leagueId) params.append('league', entities.leagueId.toString());
        if (entities.season) params.append('season', entities.season.toString());
        break;

      case 'topscorers':
        endpoint = 'players/topscorers';
        if (entities.leagueId) params.append('league', entities.leagueId.toString());
        if (entities.season) params.append('season', entities.season.toString());
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

  async fetchFootballAPI(url: string) {
    // URLs are already constructed with the Next.js API route baseURL
    let apiUrl = url;
    if (url.startsWith('https://api-football-v1.p.rapidapi.com/v3/')) {
      const path = url.replace('https://api-football-v1.p.rapidapi.com/v3/', '');
      apiUrl = `${FOOTBALL_API_CONFIG.baseURL}/${path}`;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
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

  addToHistory(role: string, content: string) {
    this.conversationHistory.push({ role, content, timestamp: new Date() });
  }

  clearHistory() {
    this.conversationHistory = [];
    this.lastAPIResponse = null;
  }
}

export const aiService = new AIService();

