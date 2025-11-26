import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY

    // If using test key, always return success
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === '1x00000000000000000000AA') {
      return NextResponse.json({ success: true })
    }

    if (!secretKey || secretKey === 'your-secret-key-here') {
      console.error('Turnstile secret key not configured')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Verify the token with Cloudflare
    const formData = new FormData()
    formData.append('secret', secretKey)
    formData.append('response', token)

    const result = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    )

    const outcome = await result.json()

    if (outcome.success) {
      return NextResponse.json({ success: true })
    } else {
      console.error('Turnstile verification failed:', outcome)
      return NextResponse.json(
        { success: false, error: 'Verification failed', details: outcome['error-codes'] },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error verifying Turnstile token:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
