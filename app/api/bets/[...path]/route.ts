import { NextRequest, NextResponse } from 'next/server'

const BETS_API_CONFIG = {
  baseURL: process.env.RAPIDAPI_BETS_BASE_URL || 'https://betsapi2.p.rapidapi.com/v1',
  apiKey: process.env.RAPIDAPI_BETS_API_KEY,
  rapidApiHost: process.env.RAPIDAPI_BETS_HOST || 'betsapi2.p.rapidapi.com'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  const url = `${BETS_API_CONFIG.baseURL}/${path}${queryString ? '?' + queryString : ''}`

  if (!BETS_API_CONFIG.apiKey) {
    return NextResponse.json(
      { error: 'BetsAPI key not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': BETS_API_CONFIG.apiKey,
        'x-rapidapi-host': BETS_API_CONFIG.rapidApiHost
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error calling BetsAPI:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
