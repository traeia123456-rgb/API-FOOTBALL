/**
 * Entity Extractor - Advanced entity extraction logic
 */

import { 
  findTeam, 
  findLeague, 
  extractTemporal, 
  extractQualifiers,
  TeamVariations,
  LeagueVariations
} from './dictionary';

export interface ExtractedEntities {
  team?: string;
  teamId?: number;
  league?: string;
  leagueId?: number;
  player?: string;
  season?: number;
  temporal?: { type: string; value?: number };
  qualifiers?: string[];
}

/**
 * Extract all known entities from query
 */
export function extractEntities(query: string): ExtractedEntities {
  const entities: ExtractedEntities = {};
  const lowerQuery = query.toLowerCase();

  // 1. Extract Team
  const teamInfo = findTeam(query);
  if (teamInfo) {
    entities.team = teamInfo.official;
    // Infer league from team if not explicitly set later
    if (teamInfo.league) {
      // We store it temporarily, but specific league mention overrides it
      entities.league = teamInfo.league; 
    }
  }

  // 2. Extract League (overrides inferred league)
  const leagueInfo = findLeague(query);
  if (leagueInfo) {
    entities.league = leagueInfo.official;
  }

  // 3. Extract Player
  // Look for patterns like "goles de [Player]", "jugador [Player]"
  const playerPatterns = [
    /(?:goles?|stats?|estadisticas?)\s+(?:de|del|de\s+la)\s+([a-záéíóúñ\s]+?)(?:\s+en|\s+de|\s+con|$)/i,
    /jugador\s+([a-záéíóúñ\s]+?)(?:\s+en|\s+de|\s+con|$)/i,
    /stats\s+([a-záéíóúñ\s]+?)(?:\s+en|\s+de|\s+con|$)/i
  ];

  for (const pattern of playerPatterns) {
    const match = query.match(pattern);
    if (match) {
      // Filter out common stop words if caught
      const candidate = match[1].trim();
      if (!['la', 'el', 'los', 'las', 'mi', 'tu'].includes(candidate.toLowerCase())) {
        entities.player = candidate;
        break;
      }
    }
  }

  // 4. Extract Temporal Info
  const temporal = extractTemporal(query);
  if (temporal) {
    entities.temporal = temporal;
  }

  // 5. Extract Qualifiers
  const qualifiers = extractQualifiers(query);
  if (qualifiers.length > 0) {
    entities.qualifiers = qualifiers;
  }

  // 6. Extract Season (simple year matching)
  const yearMatch = query.match(/\b20\d{2}\b/);
  if (yearMatch) {
    entities.season = parseInt(yearMatch[0]);
  } else {
    // Default to current year/season logic handled in service
    entities.season = new Date().getFullYear();
  }

  return entities;
}
