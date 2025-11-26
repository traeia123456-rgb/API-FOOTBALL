import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const playerId = searchParams.get('id');
    const team = searchParams.get('team');
    const league = searchParams.get('league');
    const season = searchParams.get('season') || new Date().getFullYear().toString();

    // Use Free Football Data API for player search
    if (search) {
      const url = `${process.env.RAPIDAPI_PLAYER_SEARCH_BASE_URL}/football-players-search?search=${encodeURIComponent(search)}`;
      
      const response = await fetch(url, {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_PLAYER_SEARCH_API_KEY || '',
          'x-rapidapi-host': process.env.RAPIDAPI_PLAYER_SEARCH_HOST || '',
        },
      });

      if (!response.ok) {
        throw new Error(`Player Search API error: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Use API-Football for detailed player stats
    if (playerId || team || league) {
      let url = `${process.env.RAPIDAPI_FOOTBALL_BASE_URL}/players?`;
      const params = new URLSearchParams();

      if (playerId) params.append('id', playerId);
      if (team) params.append('team', team);
      if (league) params.append('league', league);
      if (season) params.append('season', season);

      url += params.toString();

      const response = await fetch(url, {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_FOOTBALL_API_KEY || '',
          'x-rapidapi-host': process.env.RAPIDAPI_FOOTBALL_HOST || '',
        },
      });

      if (!response.ok) {
        throw new Error(`API-Football error: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Please provide search, id, team, or league parameter' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Player API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
