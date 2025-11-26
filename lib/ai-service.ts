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

  async executeFootballQuery(intent: string | null, entities: QueryResult['entities'], apiSource: 'football-api' | 'sofascore' = 'football-api') {
    if (!intent) {
      throw new Error('Intent es requerido para ejecutar la consulta')
    }

    // Route to Sofascore if selected
    if (apiSource === 'sofascore') {
      return this.executeSofascoreQuery(intent, entities);
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

  async executeSofascoreQuery(intent: string, entities: QueryResult['entities']) {
    // Dynamic import to avoid circular dependencies if any, or just standard import
    // We'll use the API route for Sofascore to keep it consistent with client-side usage if preferred,
    // but since we are server-side here (or client-side calling this service?), wait.
    // ai-service.ts is used in page.tsx which is a client component ("use client").
    // So we should call the API routes we created.
    
    let url = '';
    
    switch (intent) {
      case 'fixtures':
        // Need tournamentId and seasonId. 
        // We might need to map entities.league (name) to Sofascore tournamentId.
        // For now, let's default to Premier League (17) and current season if not found.
        // This requires a mapping or search.
        // Let's try to search for the tournament if we have a league name.
        let tournamentId = 17; // Default PL
        let seasonId = 52186; // Default 23/24 PL
        
        if (entities.league) {
           // TODO: Implement search for tournament ID via Sofascore search endpoint
           // For this MVP, we might just use the default or basic mapping
           if (entities.league.toLowerCase().includes('premier')) tournamentId = 17;
           if (entities.league.toLowerCase().includes('laliga') || entities.league.toLowerCase().includes('la liga')) tournamentId = 8;
           if (entities.league.toLowerCase().includes('bundesliga')) tournamentId = 35;
           if (entities.league.toLowerCase().includes('serie a')) tournamentId = 23;
           if (entities.league.toLowerCase().includes('ligue 1')) tournamentId = 34;
        }

        // We need to fetch seasons to get the ID for the requested season
        // For now, let's just fetch events for the tournament
        // The /api/sofascore/events endpoint requires tournamentId and seasonId
        // We can fetch seasons first to get the seasonId
        const seasonsRes = await fetch(`/api/sofascore/seasons?tournamentId=${tournamentId}`);
        const seasonsData = await seasonsRes.json();
        if (seasonsData.seasons && seasonsData.seasons.length > 0) {
            seasonId = seasonsData.seasons[0].id; // Get latest season
        }

        url = `/api/sofascore/events?tournamentId=${tournamentId}&seasonId=${seasonId}`;
        if (entities.team) {
            // We would need teamId. 
            // For now, let's just return all events for the tournament/season
        }
        break;

      case 'standings':
        let sTournamentId = 17;
        if (entities.league) {
           if (entities.league.toLowerCase().includes('premier')) sTournamentId = 17;
           if (entities.league.toLowerCase().includes('laliga') || entities.league.toLowerCase().includes('la liga')) sTournamentId = 8;
           if (entities.league.toLowerCase().includes('bundesliga')) sTournamentId = 35;
           if (entities.league.toLowerCase().includes('serie a')) sTournamentId = 23;
           if (entities.league.toLowerCase().includes('ligue 1')) sTournamentId = 34;
        }
        
        // Get season ID
        const sSeasonsRes = await fetch(`/api/sofascore/seasons?tournamentId=${sTournamentId}`);
        const sSeasonsData = await sSeasonsRes.json();
        let sSeasonId = 52186;
        if (sSeasonsData.seasons && sSeasonsData.seasons.length > 0) {
            sSeasonId = sSeasonsData.seasons[0].id;
        }

        url = `/api/sofascore/standings?tournamentId=${sTournamentId}&seasonId=${sSeasonId}`;
        break;

      case 'player_stats':
        if (entities.player) {
            // Search for player
            const searchRes = await fetch(`/api/sofascore/search?q=${encodeURIComponent(entities.player)}`);
            const searchData = await searchRes.json();
            const player = searchData.find((r: any) => r.type === 'player');
            if (player) {
                url = `/api/sofascore/player?id=${player.entity.id}`;
            } else {
                throw new Error(`Jugador ${entities.player} no encontrado en Sofascore`);
            }
        } else {
            throw new Error('Se requiere nombre de jugador para estadísticas de jugador');
        }
        break;

      default:
        throw new Error(`Intent ${intent} no soportado en Sofascore aún`);
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error fetching from Sofascore: ${response.statusText}`);
    }
    const data = await response.json();
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

