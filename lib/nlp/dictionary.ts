/**
 * NLP Dictionary - Synonyms and variations for football entities
 */

export interface TeamVariations {
  official: string;
  variations: string[];
  league?: string;
  country?: string;
}

export interface LeagueVariations {
  official: string;
  variations: string[];
  country?: string;
}

/**
 * Common teams with their variations
 */
export const TEAM_DICTIONARY: Record<string, TeamVariations> = {
  // La Liga
  'real_madrid': {
    official: 'Real Madrid',
    variations: ['madrid', 'real', 'merengues', 'blancos', 'rm', 'rmcf'],
    league: 'La Liga',
    country: 'Spain'
  },
  'barcelona': {
    official: 'Barcelona',
    variations: ['barça', 'barca', 'fcb', 'azulgrana', 'culés', 'blaugrana'],
    league: 'La Liga',
    country: 'Spain'
  },
  'atletico_madrid': {
    official: 'Atletico Madrid',
    variations: ['atleti', 'atletico', 'colchoneros', 'atm'],
    league: 'La Liga',
    country: 'Spain'
  },
  
  // Premier League
  'manchester_united': {
    official: 'Manchester United',
    variations: ['united', 'man utd', 'man u', 'mufc', 'red devils', 'diablos rojos'],
    league: 'Premier League',
    country: 'England'
  },
  'manchester_city': {
    official: 'Manchester City',
    variations: ['city', 'man city', 'mcfc', 'citizens'],
    league: 'Premier League',
    country: 'England'
  },
  'liverpool': {
    official: 'Liverpool',
    variations: ['lfc', 'reds', 'pool'],
    league: 'Premier League',
    country: 'England'
  },
  'chelsea': {
    official: 'Chelsea',
    variations: ['blues', 'cfc'],
    league: 'Premier League',
    country: 'England'
  },
  'arsenal': {
    official: 'Arsenal',
    variations: ['gunners', 'afc'],
    league: 'Premier League',
    country: 'England'
  },
  
  // Serie A
  'juventus': {
    official: 'Juventus',
    variations: ['juve', 'vecchia signora', 'bianconeri'],
    league: 'Serie A',
    country: 'Italy'
  },
  'inter': {
    official: 'Inter Milan',
    variations: ['inter', 'internazionale', 'nerazzurri'],
    league: 'Serie A',
    country: 'Italy'
  },
  'ac_milan': {
    official: 'AC Milan',
    variations: ['milan', 'rossoneri', 'acm'],
    league: 'Serie A',
    country: 'Italy'
  },
  
  // Bundesliga
  'bayern_munich': {
    official: 'Bayern Munich',
    variations: ['bayern', 'fcb', 'baviera'],
    league: 'Bundesliga',
    country: 'Germany'
  },
  'borussia_dortmund': {
    official: 'Borussia Dortmund',
    variations: ['dortmund', 'bvb', 'borussen'],
    league: 'Bundesliga',
    country: 'Germany'
  },
  
  // Ligue 1
  'psg': {
    official: 'Paris Saint-Germain',
    variations: ['psg', 'paris', 'saint germain'],
    league: 'Ligue 1',
    country: 'France'
  },
  
  // South America
  'boca_juniors': {
    official: 'Boca Juniors',
    variations: ['boca', 'xeneizes'],
    league: 'Liga Argentina',
    country: 'Argentina'
  },
  'river_plate': {
    official: 'River Plate',
    variations: ['river', 'millonarios'],
    league: 'Liga Argentina',
    country: 'Argentina'
  }
};

/**
 * League variations
 */
export const LEAGUE_DICTIONARY: Record<string, LeagueVariations> = {
  'premier_league': {
    official: 'Premier League',
    variations: ['premier', 'epl', 'liga inglesa', 'premier league inglesa'],
    country: 'England'
  },
  'la_liga': {
    official: 'La Liga',
    variations: ['liga española', 'primera division', 'laliga', 'liga'],
    country: 'Spain'
  },
  'serie_a': {
    official: 'Serie A',
    variations: ['serie a italiana', 'calcio'],
    country: 'Italy'
  },
  'bundesliga': {
    official: 'Bundesliga',
    variations: ['liga alemana', 'bundesliga alemana'],
    country: 'Germany'
  },
  'ligue_1': {
    official: 'Ligue 1',
    variations: ['liga francesa', 'ligue 1 francesa'],
    country: 'France'
  },
  'champions_league': {
    official: 'UEFA Champions League',
    variations: ['champions', 'ucl', 'copa de europa', 'champions league'],
    country: 'Europe'
  },
  'europa_league': {
    official: 'UEFA Europa League',
    variations: ['europa', 'uel'],
    country: 'Europe'
  },
  'liga_mx': {
    official: 'Liga MX',
    variations: ['liga mexicana', 'mexico'],
    country: 'Mexico'
  },
  'liga_colombiana': {
    official: 'Liga BetPlay',
    variations: ['liga colombia', 'colombia', 'betplay'],
    country: 'Colombia'
  }
};

/**
 * Action synonyms
 */
export const ACTION_SYNONYMS: Record<string, string[]> = {
  'goals': ['goles', 'tantos', 'anotaciones', 'dianas', 'gol'],
  'assists': ['asistencias', 'pases gol', 'asistencia'],
  'matches': ['partidos', 'juegos', 'encuentros', 'partido', 'match'],
  'standings': ['clasificacion', 'tabla', 'posiciones', 'tabla de posiciones'],
  'scorers': ['goleadores', 'artilleros', 'maximos goleadores', 'top scorers'],
  'fixtures': ['calendario', 'proximos partidos', 'programacion'],
  'live': ['en vivo', 'directo', 'live', 'ahora'],
  'results': ['resultados', 'marcadores', 'scores'],
  'stats': ['estadisticas', 'numeros', 'datos'],
  'form': ['racha', 'forma', 'ultimos resultados'],
  'news': ['noticias', 'novedades', 'ultimas noticias']
};

/**
 * Temporal expressions
 */
export const TEMPORAL_PATTERNS: Record<string, RegExp> = {
  'last_n': /(?:ultimos?|pasados?)\s+(\d+)/i,
  'next_n': /(?:proximos?|siguientes?)\s+(\d+)/i,
  'this_week': /esta\s+semana/i,
  'this_month': /este\s+mes/i,
  'this_season': /esta\s+(?:temporada|season)/i,
  'today': /hoy|today/i,
  'yesterday': /ayer|yesterday/i,
  'tomorrow': /mañana|tomorrow/i
};

/**
 * Qualifiers
 */
export const QUALIFIERS: Record<string, RegExp> = {
  'home_only': /(?:en\s+casa|como\s+local|de\s+local)/i,
  'away_only': /(?:fuera|como\s+visitante|de\s+visitante)/i,
  'without_penalties': /sin\s+(?:penales|penaltis)/i,
  'only_league': /solo\s+(?:en\s+)?(?:la\s+)?liga/i,
  'only_champions': /solo\s+(?:en\s+)?champions/i
};

/**
 * Find team by any variation
 */
export function findTeam(query: string): TeamVariations | null {
  const lowerQuery = query.toLowerCase().trim();
  
  for (const [key, team] of Object.entries(TEAM_DICTIONARY)) {
    if (team.official.toLowerCase() === lowerQuery) {
      return team;
    }
    
    for (const variation of team.variations) {
      if (lowerQuery.includes(variation.toLowerCase())) {
        return team;
      }
    }
  }
  
  return null;
}

/**
 * Find league by any variation
 */
export function findLeague(query: string): LeagueVariations | null {
  const lowerQuery = query.toLowerCase().trim();
  
  for (const [key, league] of Object.entries(LEAGUE_DICTIONARY)) {
    if (league.official.toLowerCase() === lowerQuery) {
      return league;
    }
    
    for (const variation of league.variations) {
      if (lowerQuery.includes(variation.toLowerCase())) {
        return league;
      }
    }
  }
  
  return null;
}

/**
 * Normalize action to standard form
 */
export function normalizeAction(query: string): string | null {
  const lowerQuery = query.toLowerCase();
  
  for (const [action, synonyms] of Object.entries(ACTION_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (lowerQuery.includes(synonym)) {
        return action;
      }
    }
  }
  
  return null;
}

/**
 * Extract temporal information
 */
export function extractTemporal(query: string): { type: string; value?: number } | null {
  for (const [type, pattern] of Object.entries(TEMPORAL_PATTERNS)) {
    const match = query.match(pattern);
    if (match) {
      return {
        type,
        value: match[1] ? parseInt(match[1]) : undefined
      };
    }
  }
  
  return null;
}

/**
 * Extract qualifiers
 */
export function extractQualifiers(query: string): string[] {
  const found: string[] = [];
  
  for (const [qualifier, pattern] of Object.entries(QUALIFIERS)) {
    if (pattern.test(query)) {
      found.push(qualifier);
    }
  }
  
  return found;
}
