import { NextResponse } from 'next/server'

export const runtime = 'edge'

// Flux Schnell via Replicate or Together.ai
// Fast, cheap, good enough for contextual chat images

export async function POST(request) {
  try {
    const { prompt, context } = await request.json()
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }
    
    // Try Together.ai first (usually faster)
    const togetherKey = process.env.TOGETHER_API_KEY
    const replicateKey = process.env.REPLICATE_API_TOKEN
    
    if (togetherKey) {
      return await generateWithTogether(prompt, togetherKey)
    } else if (replicateKey) {
      return await generateWithReplicate(prompt, replicateKey)
    } else {
      return NextResponse.json({ 
        error: 'No image API configured. Set TOGETHER_API_KEY or REPLICATE_API_TOKEN' 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function generateWithTogether(prompt, apiKey) {
  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt: prompt,
      width: 512,
      height: 512,
      n: 1,
      response_format: 'b64_json'
    })
  })
  
  const data = await response.json()
  
  if (data.error) {
    throw new Error(data.error.message || 'Together API error')
  }
  
  const imageBase64 = data.data?.[0]?.b64_json
  if (!imageBase64) {
    throw new Error('No image returned')
  }
  
  return NextResponse.json({ 
    image: `data:image/png;base64,${imageBase64}`,
    provider: 'together'
  })
}

async function generateWithReplicate(prompt, apiKey) {
  // Start the prediction
  const startResponse = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: {
        prompt: prompt,
        num_outputs: 1,
        aspect_ratio: '1:1',
        output_format: 'webp',
        output_quality: 80
      }
    })
  })
  
  const prediction = await startResponse.json()
  
  if (prediction.error) {
    throw new Error(prediction.error)
  }
  
  // Poll for completion (Schnell is fast, usually <3 seconds)
  let result = prediction
  let attempts = 0
  const maxAttempts = 30 // 15 seconds max
  
  while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 500))
    
    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Token ${apiKey}` }
    })
    result = await pollResponse.json()
    attempts++
  }
  
  if (result.status === 'failed') {
    throw new Error(result.error || 'Generation failed')
  }
  
  if (!result.output || !result.output[0]) {
    throw new Error('No image returned')
  }
  
  return NextResponse.json({ 
    image: result.output[0],
    provider: 'replicate'
  })
}
