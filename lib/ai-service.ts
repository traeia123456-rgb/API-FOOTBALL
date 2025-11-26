// ============================================
// SIMPLIFIED AI SERVICE - NO AI REQUIRED
// ============================================

import { parseNaturalLanguageQuery } from './nlp/query-parser';
import { generateIntelligentResponse } from './response-generator';

// Football API Configuration - Now using Next.js API routes
const FOOTBALL_API_CONFIG = {
  baseURL: '/api/football', // Next.js API route
};

interface QueryResult {
  intent: string | null;
  entities: {
    player?: string;
    team?: string;
    teamId?: number;
    league?: string;
    leagueId?: number;
    season?: number;
    temporal?: { type: string; value?: number };
    qualifiers?: string[];
  };
  needsSearch: boolean;
}

class AIService {
  conversationHistory: Array<{ role: string; content: string; timestamp: Date }>;
  lastAPIResponse: any;
  lastQuery: string = '';

  constructor() {
    this.conversationHistory = [];
    this.lastAPIResponse = null;
  }

  /**
   * Process user query using enhanced NLP
   */
  async processUserQuery(userMessage: string): Promise<QueryResult> {
    try {
      this.lastQuery = userMessage;
      const parsed = parseNaturalLanguageQuery(userMessage);
      
      const result: QueryResult = {
        intent: parsed.intent.primary,
        entities: parsed.entities,
        needsSearch: parsed.intent.primary !== 'unknown'
      };

      if (result.needsSearch) {
        await this.resolveEntities(result.entities);
      }

      return result;
    } catch (error) {
      console.error('Error processing query:', error);
      throw new Error('No pude procesar tu consulta. Intenta con: "partidos de [equipo]", "clasificacion de [liga]", "goleadores de [liga]"');
    }
  }

  /**
   * Analyze results using intelligent response generator
   */
  async analyzeResults(userQuestion: string): Promise<string> {
    if (!this.lastAPIResponse) {
      throw new Error('No hay resultados previos para analizar.');
    }

    // Use the new response generator
    // We need to re-parse to get the intent again or store it. 
    // For now, we'll re-parse quickly or pass the intent if we stored it.
    // Better: parseNaturalLanguageQuery is fast, we can call it.
    const parsed = parseNaturalLanguageQuery(userQuestion);
    
    return generateIntelligentResponse(
      userQuestion,
      parsed.intent.primary,
      this.lastAPIResponse
    );
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

      case 'player_stats':
        endpoint = 'players';
        if (entities.player) {
          // First search for the player
          params.append('search', entities.player);
        }
        if (entities.teamId) params.append('team', entities.teamId.toString());
        if (entities.leagueId) params.append('league', entities.leagueId.toString());
        if (entities.season) params.append('season', entities.season.toString());
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

