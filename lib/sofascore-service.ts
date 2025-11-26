import { headers } from 'next/headers';

// List of common User-Agents to rotate
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

const BASE_URL = 'https://api.sofascore.com/api/v1';

export interface Tournament {
  name: string;
  id: number;
}

export interface Team {
  id: number;
  name: string;
}

export interface Event {
  id: number;
  tournament: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  startTimestamp: number;
  status: {
    code: number;
    description: string;
  };
}

export class SofascoreService {
  private lastRequestTime: number = 0;
  private minDelay: number = 500; // Minimum delay in ms
  private maxDelay: number = 1500; // Maximum delay in ms

  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delay = Math.floor(Math.random() * (this.maxDelay - this.minDelay + 1) + this.minDelay);

    if (timeSinceLastRequest < delay) {
      await this.sleep(delay - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
  }

  private async fetch(endpoint: string, retries = 3): Promise<any> {
    await this.enforceRateLimit();

    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'User-Agent': this.getRandomUserAgent(),
      'Referer': 'https://www.sofascore.com/',
      'Origin': 'https://www.sofascore.com',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    try {
      const response = await fetch(url, {
        headers,
        method: 'GET',
        cache: 'no-store'
      });

      if (response.status === 429 || response.status === 403) {
        if (retries > 0) {
          console.warn(`Sofascore API ${response.status} error. Retrying in 2s... (${retries} retries left)`);
          await this.sleep(2000 * (4 - retries)); // Exponential backoff: 2s, 4s, 6s
          return this.fetch(endpoint, retries - 1);
        }
      }

      if (!response.ok) {
        throw new Error(`Sofascore API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  async getSeasons(tournamentId: number) {
    const data = await this.fetch(`/tournament/${tournamentId}/seasons`);
    return data.seasons;
  }

  async getLastSeason(tournamentId: number) {
    const seasons = await this.getSeasons(tournamentId);
    if (seasons && seasons.length > 0) {
      return seasons[0];
    }
    throw new Error('No seasons found');
  }

  async getStandings(tournamentId: number, seasonId: number) {
    const data = await this.fetch(`/tournament/${tournamentId}/season/${seasonId}/standings/total`);
    const standings = data.standings[0];
    
    return standings.rows.map((row: any) => ({
      id: row.team.id,
      name: row.team.name,
      matches: row.matches,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      points: row.points
    }));
  }

  async getEvents(tournamentId: number, seasonId: number, teamId?: number) {
    const data = await this.fetch(`/tournament/${tournamentId}/season/${seasonId}/events`);
    let events = data.events;

    if (teamId) {
      events = events.filter((event: any) => 
        event.homeTeam.id === teamId || event.awayTeam.id === teamId
      );
    }

    return events
      .filter((event: any) => event.status.code === 100)
      .map((event: any) => ({
        id: event.id,
        tournament: event.tournament.name,
        homeTeam: event.homeTeam.name,
        homeTeamId: event.homeTeam.id,
        homeScore: event.homeScore.current,
        awayTeam: event.awayTeam.name,
        awayTeamId: event.awayTeam.id,
        awayScore: event.awayScore.current,
        startTimestamp: event.startTimestamp,
        date: new Date(event.startTimestamp * 1000).toISOString()
      }));
  }

  async getEventStatistics(eventId: number) {
    const data = await this.fetch(`/event/${eventId}/statistics`);
    if (!data.statistics || data.statistics.length === 0) {
      return [];
    }
    return data.statistics[0].groups;
  }

  async search(query: string) {
    const data = await this.fetch(`/search/all?q=${encodeURIComponent(query)}`);
    return data.results;
  }

  async getPlayer(playerId: number) {
    const data = await this.fetch(`/player/${playerId}`);
    return data.player;
  }

  async getPlayerStatistics(playerId: number, seasonId: number, tournamentId: number) {
    // Statistics for a player in a specific season/tournament
    const data = await this.fetch(`/player/${playerId}/unique-tournament/${tournamentId}/season/${seasonId}/statistics/overall`);
    return data.statistics;
  }

  async getPlayerLastYearSummary(playerId: number) {
    // Useful for the "Resumen (últimos 12 meses)" chart
    // Note: This endpoint might vary, but let's try a common one or just rely on season stats.
    // Sofascore often has /player/{id}/statistics/seasons
    const data = await this.fetch(`/player/${playerId}/statistics/seasons`);
    return data.uniqueTournamentSeasons;
  }
}

export const sofascoreService = new SofascoreService();
