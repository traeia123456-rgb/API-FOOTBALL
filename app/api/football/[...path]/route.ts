import { NextRequest, NextResponse } from 'next/server'

const FOOTBALL_API_CONFIG = {
  baseURL: process.env.RAPIDAPI_FOOTBALL_BASE_URL || 'https://api-football-v1.p.rapidapi.com/v3',
  apiKey: process.env.RAPIDAPI_FOOTBALL_API_KEY,
  rapidApiHost: process.env.RAPIDAPI_FOOTBALL_HOST || 'api-football-v1.p.rapidapi.com'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  const url = `${FOOTBALL_API_CONFIG.baseURL}/${path}${queryString ? '?' + queryString : ''}`

  if (!FOOTBALL_API_CONFIG.apiKey) {
    return NextResponse.json(
      { error: 'Football API key not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': FOOTBALL_API_CONFIG.apiKey,
        'x-rapidapi-host': FOOTBALL_API_CONFIG.rapidApiHost
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error calling Football API:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

