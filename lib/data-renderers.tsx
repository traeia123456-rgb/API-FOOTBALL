import React from 'react';

/**
 * Get status text in Spanish
 */
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'TBD': 'Por definir',
    'NS': 'No iniciado',
    '1H': 'Primer tiempo',
    'HT': 'Medio tiempo',
    '2H': 'Segundo tiempo',
    'ET': 'Tiempo extra',
    'P': 'Penales',
    'FT': 'Finalizado',
    'AET': 'Finalizado (TE)',
    'PEN': 'Finalizado (Pen)',
    'BT': 'Break',
    'SUSP': 'Suspendido',
    'INT': 'Interrumpido',
    'PST': 'Pospuesto',
    'CANC': 'Cancelado',
    'ABD': 'Abandonado',
    'AWD': 'Adjudicado',
    'WO': 'WalkOver',
    'LIVE': 'En vivo'
  };

  return statusMap[status] || status;
}

/**
 * Render fixtures/matches
 */
export function renderFixtures(fixturesData: any): string {
  if (!fixturesData || !fixturesData.response || fixturesData.response.length === 0) {
    return '<div class="no-data">No se encontraron partidos.</div>';
  }

  const fixtures = fixturesData.response;

  let html = '<div class="fixtures-container">';

  fixtures.forEach((fixture: any) => {
    const homeTeam = fixture.teams.home;
    const awayTeam = fixture.teams.away;
    const score = fixture.goals;
    const status = fixture.fixture.status.short;
    const date = new Date(fixture.fixture.date);

    const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(status);
    const isFinished = status === 'FT';

    html += `
      <div class="fixture-card ${isLive ? 'live' : ''} ${isFinished ? 'finished' : ''}">
        <div class="fixture-header">
          <span class="fixture-league">${fixture.league.name}</span>
          <span class="fixture-date">${date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}</span>
          ${isLive ? '<span class="live-badge">🔴 EN VIVO</span>' : ''}
        </div>
        <div class="fixture-teams">
          <div class="team-side">
            <img src="${homeTeam.logo}" alt="${homeTeam.name}" class="team-logo-small">
            <span class="team-name">${homeTeam.name}</span>
          </div>
          <div class="fixture-score">
            ${isFinished || isLive ?
              `<span class="score">${score.home} - ${score.away}</span>` :
              `<span class="time">${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>`
            }
            <span class="status">${getStatusText(status)}</span>
          </div>
          <div class="team-side">
            <span class="team-name">${awayTeam.name}</span>
            <img src="${awayTeam.logo}" alt="${awayTeam.name}" class="team-logo-small">
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

/**
 * Render standings/classification table
 */
export function renderStandings(standingsData: any): string {
  if (!standingsData || !standingsData.response || standingsData.response.length === 0) {
    return '<div class="no-data">No se encontró información de clasificación.</div>';
  }

  const league = standingsData.response[0].league;
  
  // Validate that league exists and has standings
  if (!league || !league.standings || !Array.isArray(league.standings) || league.standings.length === 0) {
    return '<div class="no-data">No se encontró información de clasificación.</div>';
  }

  const standings = league.standings[0];
  
  // Validate that standings array exists and has data
  if (!standings || !Array.isArray(standings) || standings.length === 0) {
    return '<div class="no-data">No se encontró información de clasificación.</div>';
  }

  const leagueName = league.name;
  const season = league.season;

  let html = `
    <div class="standings-container">
      <div class="standings-header">
        <h3>${leagueName} - Temporada ${season}</h3>
      </div>
      <table class="standings-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Equipo</th>
            <th>PJ</th>
            <th>G</th>
            <th>E</th>
            <th>P</th>
            <th>GF</th>
            <th>GC</th>
            <th>DG</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
  `;

  standings.forEach((team: any) => {
    const position = team.rank;
    let positionClass = '';

    if (position <= 4) positionClass = 'champions-league';
    else if (position <= 6) positionClass = 'europa-league';
    else if (position >= standings.length - 2) positionClass = 'relegation';

    html += `
      <tr class="${positionClass}">
        <td class="position">${position}</td>
        <td class="team-cell">
          <img src="${team.team.logo}" alt="${team.team.name}" class="team-logo-tiny">
          <span>${team.team.name}</span>
        </td>
        <td>${team.all.played}</td>
        <td>${team.all.win}</td>
        <td>${team.all.draw}</td>
        <td>${team.all.lose}</td>
        <td>${team.all.goals.for}</td>
        <td>${team.all.goals.against}</td>
        <td>${team.goalsDiff}</td>
        <td class="points"><strong>${team.points}</strong></td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
      <div class="standings-legend">
        <span class="legend-item"><span class="legend-color champions-league"></span> Champions League</span>
        <span class="legend-item"><span class="legend-color europa-league"></span> Europa League</span>
        <span class="legend-item"><span class="legend-color relegation"></span> Descenso</span>
      </div>
    </div>
  `;

  return html;
}

/**
 * Render top scorers
 */
export function renderTopScorers(scorersData: any): string {
  if (!scorersData || !scorersData.response || scorersData.response.length === 0) {
    return '<div class="no-data">No se encontraron goleadores.</div>';
  }

  const scorers = scorersData.response;

  let html = `
    <div class="scorers-container">
      <h3>⚽ Máximos Goleadores</h3>
      <div class="scorers-list">
  `;

  scorers.forEach((scorer: any, index: number) => {
    const player = scorer.player;
    const stats = scorer.statistics[0];

    html += `
      <div class="scorer-card">
        <div class="scorer-rank">${index + 1}</div>
        <img src="${player.photo}" alt="${player.name}" class="scorer-photo">
        <div class="scorer-info">
          <h4>${player.name}</h4>
          <p class="scorer-team">
            <img src="${stats.team.logo}" alt="${stats.team.name}" class="team-logo-tiny">
            ${stats.team.name}
          </p>
        </div>
        <div class="scorer-stats">
          <div class="scorer-goals">${stats.goals.total}</div>
          <div class="scorer-label">Goles</div>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

/**
 * Render player statistics
 */
export function renderPlayerStats(playersData: any): string {
  if (!playersData || !playersData.response || playersData.response.length === 0) {
    return '<div class="no-data">No se encontraron datos del jugador.</div>';
  }

  const players = playersData.response;

  let html = `
    <div class="players-container">
      <h3>⚽ Estadísticas de Jugadores</h3>
      <div class="players-list">
  `;

  players.forEach((playerData: any) => {
    const player = playerData.player;
    const stats = playerData.statistics && playerData.statistics.length > 0 ? playerData.statistics[0] : null;

    if (!stats) {
      html += `
        <div class="player-card">
          <div class="player-header">
            <img src="${player.photo}" alt="${player.name}" class="player-photo">
            <div class="player-basic-info">
              <h4>${player.name}</h4>
              <p>${player.nationality || 'N/A'} • ${player.age || 'N/A'} años</p>
            </div>
          </div>
          <p class="no-stats">No hay estadísticas disponibles para este jugador.</p>
        </div>
      `;
      return;
    }

    const team = stats.team;
    const league = stats.league;
    const games = stats.games;
    const goals = stats.goals;
    const passes = stats.passes;
    const tackles = stats.tackles;
    const duels = stats.duels;

    html += `
      <div class="player-card">
        <div class="player-header">
          <img src="${player.photo}" alt="${player.name}" class="player-photo">
          <div class="player-basic-info">
            <h4>${player.name}</h4>
            <p>${player.nationality || 'N/A'} • ${player.age || 'N/A'} años</p>
            <p class="player-position">${games.position || 'N/A'}</p>
          </div>
        </div>
        
        <div class="player-team-info">
          <img src="${team.logo}" alt="${team.name}" class="team-logo-small">
          <span>${team.name}</span>
          <span class="league-name">${league.name}</span>
        </div>

        <div class="player-stats-grid">
          <div class="stat-box">
            <div class="stat-value">${games.appearences || 0}</div>
            <div class="stat-label">Partidos</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${goals.total || 0}</div>
            <div class="stat-label">Goles</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${goals.assists || 0}</div>
            <div class="stat-label">Asistencias</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${games.rating || 'N/A'}</div>
            <div class="stat-label">Rating</div>
          </div>
        </div>

        ${goals.total && goals.total > 0 ? `
          <div class="player-details">
            <h5>Detalles de Goles</h5>
            <div class="details-grid">
              <span>Pie derecho: ${goals.right || 0}</span>
              <span>Pie izquierdo: ${goals.left || 0}</span>
              <span>Cabeza: ${goals.head || 0}</span>
              <span>Penales: ${goals.penalty || 0}</span>
            </div>
          </div>
        ` : ''}

        ${passes && passes.accuracy ? `
          <div class="player-details">
            <h5>Pases</h5>
            <div class="details-grid">
              <span>Precisión: ${passes.accuracy}%</span>
              <span>Pases clave: ${passes.key || 0}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}


/**
 * Main render function - routes to appropriate renderer
 */
export function renderFootballData(data: any, intent: string): string {
  switch (intent) {
    case 'fixtures':
    case 'live':
      return renderFixtures(data);
    case 'standings':
      return renderStandings(data);
    case 'topscorers':
      return renderTopScorers(data);
    case 'player_stats':
      return renderPlayerStats(data);
    default:
      return `<div class="json-viewer"><pre>${JSON.stringify(data, null, 2)}</pre></div>`;
  }
}

