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
