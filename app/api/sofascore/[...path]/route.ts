import { NextRequest, NextResponse } from 'next/server';
import { sofascoreService } from '@/lib/sofascore-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path;
  const endpoint = path[0]; // e.g., 'seasons', 'standings', 'events'

  try {
    let result;

    // Map URL paths to service methods
    // /api/sofascore/seasons?tournamentId=1
    if (endpoint === 'seasons') {
      const tournamentId = request.nextUrl.searchParams.get('tournamentId');
      if (!tournamentId) throw new Error('tournamentId is required');
      result = await sofascoreService.getSeasons(parseInt(tournamentId));
    }
    // /api/sofascore/standings?tournamentId=1&seasonId=123
    else if (endpoint === 'standings') {
      const tournamentId = request.nextUrl.searchParams.get('tournamentId');
      const seasonId = request.nextUrl.searchParams.get('seasonId');
      if (!tournamentId || !seasonId) throw new Error('tournamentId and seasonId are required');
      result = await sofascoreService.getStandings(parseInt(tournamentId), parseInt(seasonId));
    }
    // /api/sofascore/events?tournamentId=1&seasonId=123&teamId=456
    else if (endpoint === 'events') {
      const tournamentId = request.nextUrl.searchParams.get('tournamentId');
      const seasonId = request.nextUrl.searchParams.get('seasonId');
      const teamId = request.nextUrl.searchParams.get('teamId');
      
      if (!tournamentId || !seasonId) throw new Error('tournamentId and seasonId are required');
      
      result = await sofascoreService.getEvents(
        parseInt(tournamentId), 
        parseInt(seasonId), 
        teamId ? parseInt(teamId) : undefined
      );
    }
    // /api/sofascore/statistics?eventId=123
    else if (endpoint === 'statistics') {
      const eventId = request.nextUrl.searchParams.get('eventId');
      if (!eventId) throw new Error('eventId is required');
      result = await sofascoreService.getEventStatistics(parseInt(eventId));
    }
    // /api/sofascore/search?q=Messi
    else if (endpoint === 'search') {
      const q = request.nextUrl.searchParams.get('q');
      if (!q) throw new Error('q (query) is required');
      result = await sofascoreService.search(q);
    }
    // /api/sofascore/player?id=123
    else if (endpoint === 'player') {
      const id = request.nextUrl.searchParams.get('id');
      if (!id) throw new Error('id is required');
      result = await sofascoreService.getPlayer(parseInt(id));
    }
    // /api/sofascore/player-statistics?playerId=123&seasonId=456&tournamentId=789
    else if (endpoint === 'player-statistics') {
      const playerId = request.nextUrl.searchParams.get('playerId');
      const seasonId = request.nextUrl.searchParams.get('seasonId');
      const tournamentId = request.nextUrl.searchParams.get('tournamentId');
      
      if (!playerId || !seasonId || !tournamentId) throw new Error('playerId, seasonId, and tournamentId are required');
      
      result = await sofascoreService.getPlayerStatistics(
        parseInt(playerId),
        parseInt(seasonId),
        parseInt(tournamentId)
      );
    }
    else {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in Sofascore API route:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
