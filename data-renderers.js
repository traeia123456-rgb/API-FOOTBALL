// ============================================
// DATA RENDERERS - FOOTBALL DATA VISUALIZATION
// ============================================

/**
 * Render player information
 */
function renderPlayer(playerData) {
    if (!playerData || !playerData.response || playerData.response.length === 0) {
        return '<div class="no-data">No se encontró información del jugador.</div>';
    }

    const player = playerData.response[0].player;
    const statistics = playerData.response[0].statistics[0] || {};

    return `
        <div class="football-data-card player-card">
            <div class="player-header">
                <img src="${player.photo}" alt="${player.name}" class="player-photo">
                <div class="player-info">
                    <h3>${player.name}</h3>
                    <p class="player-meta">
                        <span>🎂 ${player.age} años</span>
                        <span>🏳️ ${player.nationality}</span>
                        <span>📍 ${player.height || 'N/A'}</span>
                    </p>
                </div>
            </div>
            ${statistics.team ? `
                <div class="player-stats">
                    <h4>Estadísticas - ${statistics.team.name}</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Partidos</span>
                            <span class="stat-value">${statistics.games?.appearences || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Goles</span>
                            <span class="stat-value">${statistics.goals?.total || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Asistencias</span>
                            <span class="stat-value">${statistics.goals?.assists || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Tarjetas Amarillas</span>
                            <span class="stat-value">${statistics.cards?.yellow || 0}</span>
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Render team information
 */
function renderTeam(teamData) {
    if (!teamData || !teamData.response || teamData.response.length === 0) {
        return '<div class="no-data">No se encontró información del equipo.</div>';
    }

    const team = teamData.response[0].team;
    const venue = teamData.response[0].venue;

    return `
        <div class="football-data-card team-card">
            <div class="team-header">
                <img src="${team.logo}" alt="${team.name}" class="team-logo">
                <div class="team-info">
                    <h3>${team.name}</h3>
                    <p class="team-meta">
                        <span>🏳️ ${team.country}</span>
                        <span>📅 Fundado: ${team.founded || 'N/A'}</span>
                    </p>
                </div>
            </div>
            ${venue ? `
                <div class="venue-info">
                    <h4>🏟️ Estadio</h4>
                    <p><strong>${venue.name}</strong></p>
                    <p>📍 ${venue.city}, ${venue.address || ''}</p>
                    <p>👥 Capacidad: ${venue.capacity?.toLocaleString() || 'N/A'}</p>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Render fixtures/matches
 */
function renderFixtures(fixturesData) {
    if (!fixturesData || !fixturesData.response || fixturesData.response.length === 0) {
        return '<div class="no-data">No se encontraron partidos.</div>';
    }

    const fixtures = fixturesData.response;

    let html = '<div class="fixtures-container">';

    fixtures.forEach(fixture => {
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
function renderStandings(standingsData) {
    if (!standingsData || !standingsData.response || standingsData.response.length === 0) {
        return '<div class="no-data">No se encontró información de clasificación.</div>';
    }

    const standings = standingsData.response[0].league.standings[0];
    const leagueName = standingsData.response[0].league.name;
    const season = standingsData.response[0].league.season;

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

    standings.forEach(team => {
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
function renderTopScorers(scorersData) {
    if (!scorersData || !scorersData.response || scorersData.response.length === 0) {
        return '<div class="no-data">No se encontraron goleadores.</div>';
    }

    const scorers = scorersData.response;

    let html = `
        <div class="scorers-container">
            <h3>⚽ Máximos Goleadores</h3>
            <div class="scorers-list">
    `;

    scorers.forEach((scorer, index) => {
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
 * Render generic JSON data
 */
function renderGenericData(data) {
    return `
        <div class="json-viewer">
            <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
    `;
}

/**
 * Get status text in Spanish
 */
function getStatusText(status) {
    const statusMap = {
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
 * Main render function - routes to appropriate renderer
 */
function renderFootballData(data, intent) {
    switch (intent) {
        case 'players':
            return renderPlayer(data);
        case 'teams':
            return renderTeam(data);
        case 'fixtures':
        case 'live':
            return renderFixtures(data);
        case 'standings':
            return renderStandings(data);
        case 'topscorers':
            return renderTopScorers(data);
        default:
            return renderGenericData(data);
    }
}
