/**
 * Response Generator - Creates intelligent, contextual responses
 */

import { conversationContext } from './nlp/context-manager';

interface DataInsights {
  totalItems: number;
  highlights: string[];
  suggestions: string[];
}

/**
 * Generate insights from fixtures data
 */
function analyzeFixtures(data: any): DataInsights {
  const insights: DataInsights = {
    totalItems: 0,
    highlights: [],
    suggestions: []
  };

  if (!data.response || data.response.length === 0) {
    return insights;
  }

  const fixtures = data.response;
  insights.totalItems = fixtures.length;

  // Analyze wins/losses/draws
  let wins = 0, losses = 0, draws = 0;
  fixtures.forEach((f: any) => {
    if (f.fixture.status.short === 'FT') {
      const homeGoals = f.goals.home;
      const awayGoals = f.goals.away;
      if (homeGoals > awayGoals) wins++;
      else if (homeGoals < awayGoals) losses++;
      else draws++;
    }
  });

  if (wins >= 3) {
    insights.highlights.push(`🔥 Buena racha: ${wins} victorias`);
  }
  if (losses >= 3) {
    insights.highlights.push(`⚠️ Momento difícil: ${losses} derrotas`);
  }

  // Check for live matches
  const liveMatches = fixtures.filter((f: any) => 
    ['1H', '2H', 'HT'].includes(f.fixture.status.short)
  );
  if (liveMatches.length > 0) {
    insights.highlights.push(`🔴 ${liveMatches.length} partido(s) en vivo`);
  }

  return insights;
}

/**
 * Generate insights from standings data
 */
function analyzeStandings(data: any): DataInsights {
  const insights: DataInsights = {
    totalItems: 0,
    highlights: [],
    suggestions: []
  };

  if (!data.response || data.response.length === 0) {
    return insights;
  }

  const standings = data.response[0]?.league?.standings?.[0];
  if (!standings) return insights;

  insights.totalItems = standings.length;

  // Find top teams
  const top3 = standings.slice(0, 3);
  insights.highlights.push(
    `🥇 Líder: ${top3[0].team.name} con ${top3[0].points} puntos`
  );

  // Find relegation zone
  const relegation = standings.slice(-3);
  insights.highlights.push(
    `⚠️ Zona de descenso: ${relegation.map((t: any) => t.team.name).join(', ')}`
  );

  return insights;
}

/**
 * Generate insights from top scorers data
 */
function analyzeTopScorers(data: any): DataInsights {
  const insights: DataInsights = {
    totalItems: 0,
    highlights: [],
    suggestions: []
  };

  if (!data.response || data.response.length === 0) {
    return insights;
  }

  const scorers = data.response;
  insights.totalItems = scorers.length;

  if (scorers.length > 0) {
    const topScorer = scorers[0];
    const goals = topScorer.statistics[0].goals.total;
    insights.highlights.push(
      `⚽ Máximo goleador: ${topScorer.player.name} con ${goals} goles`
    );
  }

  // Check for ties
  if (scorers.length >= 2) {
    const first = scorers[0].statistics[0].goals.total;
    const second = scorers[1].statistics[0].goals.total;
    if (first === second) {
      insights.highlights.push(`🤝 Empate en la cima con ${first} goles`);
    }
  }

  return insights;
}

/**
 * Generate insights from player stats
 */
function analyzePlayerStats(data: any): DataInsights {
  const insights: DataInsights = {
    totalItems: 0,
    highlights: [],
    suggestions: []
  };

  if (!data.response || data.response.length === 0) {
    return insights;
  }

  const players = data.response;
  insights.totalItems = players.length;

  players.forEach((playerData: any) => {
    const stats = playerData.statistics?.[0];
    if (!stats) return;

    const goals = stats.goals?.total || 0;
    const assists = stats.goals?.assists || 0;
    const rating = stats.games?.rating;

    if (goals > 10) {
      insights.highlights.push(`⚽ Excelente goleador: ${goals} goles`);
    }
    if (assists > 5) {
      insights.highlights.push(`🎯 Gran asistidor: ${assists} asistencias`);
    }
    if (rating && parseFloat(rating) > 7.5) {
      insights.highlights.push(`⭐ Rating destacado: ${rating}`);
    }
  });

  return insights;
}

/**
 * Main function to generate intelligent response
 */
export function generateIntelligentResponse(
  query: string,
  intent: string,
  data: any
): string {
  let insights: DataInsights;

  // Analyze data based on intent
  switch (intent) {
    case 'fixtures':
    case 'live':
      insights = analyzeFixtures(data);
      break;
    case 'standings':
      insights = analyzeStandings(data);
      break;
    case 'topscorers':
      insights = analyzeTopScorers(data);
      break;
    case 'player_stats':
      insights = analyzePlayerStats(data);
      break;
    default:
      insights = { totalItems: 0, highlights: [], suggestions: [] };
  }

  // Build response
  let response = '';

  // Add context-aware introduction
  const isFollowUp = conversationContext.isFollowUp(query);
  if (isFollowUp) {
    response += 'Aquí tienes la información adicional:\n\n';
  } else {
    response += `Encontré ${insights.totalItems} resultado(s) para tu consulta.\n\n`;
  }

  // Add highlights
  if (insights.highlights.length > 0) {
    response += '**Destacados:**\n';
    insights.highlights.forEach(h => {
      response += `• ${h}\n`;
    });
    response += '\n';
  }

  return response;
}

/**
 * Generate suggestions for related queries
 */
export function generateSuggestions(intent: string, entities: any): string[] {
  const suggestions: string[] = [];

  if (entities.team) {
    if (intent !== 'standings') {
      suggestions.push(`Ver clasificación de ${entities.league || 'la liga'}`);
    }
    if (intent !== 'topscorers') {
      suggestions.push(`Ver goleadores de ${entities.team}`);
    }
    if (intent !== 'fixtures') {
      suggestions.push(`Ver próximos partidos de ${entities.team}`);
    }
  }

  if (entities.league && !entities.team) {
    suggestions.push(`Ver equipos destacados de ${entities.league}`);
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
}
