/**
 * Intent Detector - Enhanced intent detection logic
 */

import { normalizeAction } from './dictionary';

export type IntentType = 
  | 'fixtures' 
  | 'standings' 
  | 'topscorers' 
  | 'player_stats' 
  | 'live' 
  | 'team_info' 
  | 'league_info'
  | 'unknown';

export interface IntentResult {
  primary: IntentType;
  confidence: number;
  secondary?: IntentType;
}

/**
 * Detect intent from query and entities
 */
export function detectIntent(query: string, entities: any): IntentResult {
  const lowerQuery = query.toLowerCase();
  const action = normalizeAction(query);
  
  // 1. Check for explicit player stats intent
  if (entities.player || 
      lowerQuery.includes('jugador') || 
      lowerQuery.includes('stats de') || 
      lowerQuery.includes('estadisticas de')) {
    return { primary: 'player_stats', confidence: 0.9 };
  }

  // 2. Check for normalized actions
  if (action) {
    switch (action) {
      case 'standings':
        return { primary: 'standings', confidence: 0.9 };
      case 'scorers':
        return { primary: 'topscorers', confidence: 0.9 };
      case 'live':
        return { primary: 'live', confidence: 0.9 };
      case 'fixtures':
      case 'matches':
      case 'results':
        return { primary: 'fixtures', confidence: 0.9 };
      case 'stats':
        // If team is present but no specific stat, default to team info or fixtures
        if (entities.team) return { primary: 'team_info', confidence: 0.7 };
        return { primary: 'fixtures', confidence: 0.6 };
    }
  }

  // 3. Context-based inference
  if (entities.team) {
    // "Real Madrid" -> usually means show matches or info
    if (lowerQuery.includes('contra') || lowerQuery.includes('vs')) {
      return { primary: 'fixtures', confidence: 0.8 };
    }
    return { primary: 'fixtures', confidence: 0.6, secondary: 'team_info' };
  }

  if (entities.league) {
    // "La Liga" -> usually means standings
    return { primary: 'standings', confidence: 0.7, secondary: 'fixtures' };
  }

  // 4. Keyword fallback
  if (lowerQuery.includes('tabla') || lowerQuery.includes('posiciones')) {
    return { primary: 'standings', confidence: 0.8 };
  }
  if (lowerQuery.includes('goleador')) {
    return { primary: 'topscorers', confidence: 0.8 };
  }
  if (lowerQuery.includes('partido') || lowerQuery.includes('juego') || lowerQuery.includes('resultado')) {
    return { primary: 'fixtures', confidence: 0.8 };
  }
  if (lowerQuery.includes('vivo') || lowerQuery.includes('directo')) {
    return { primary: 'live', confidence: 0.8 };
  }

  // Default fallback
  return { primary: 'fixtures', confidence: 0.3 };
}
