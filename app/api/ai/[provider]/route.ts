import { NextRequest, NextResponse } from 'next/server'

const AI_CONFIG = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo'
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat'
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider
  const { messages, temperature, max_tokens } = await request.json()

  if (!AI_CONFIG[provider as keyof typeof AI_CONFIG]) {
    return NextResponse.json(
      { error: 'Invalid AI provider' },
      { status: 400 }
    )
  }

  const config = AI_CONFIG[provider as keyof typeof AI_CONFIG]

  if (!config.apiKey) {
    return NextResponse.json(
      { error: 'AI API key not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1000
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error calling AI API:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

