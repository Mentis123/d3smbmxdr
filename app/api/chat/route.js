import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'edge'

export async function POST(request) {
  try {
    const { systemPrompt, messages, leadData } = await request.json()

    // Handle lead saving
    if (leadData) {
      const dbUrl = process.env.DATABASE_URL
      if (dbUrl) {
        try {
          const sql = neon(dbUrl)
          await sql`
            INSERT INTO mxdr_leads (
              company_name, industry, employee_count, 
              contact_name, contact_email, contact_phone,
              qualification_score, recommended_solution, chat_summary,
              status
            ) VALUES (
              ${leadData.company || null}, 
              ${leadData.industry || null}, 
              ${leadData.employees || null},
              ${leadData.name || null},
              ${leadData.email || null},
              ${leadData.phone || null},
              ${leadData.score || 0},
              ${leadData.recommendation || 'MXDR'},
              ${leadData.summary || null},
              'new'
            )
          `
          console.log('Lead saved successfully')
        } catch (dbError) {
          console.error('Failed to save lead:', dbError)
        }
      }
      
      // If only lead data, return success
      if (!messages || messages.length === 0) {
        return NextResponse.json({ success: true })
      }
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 })
    }

    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    const requestBody = {
      contents: geminiMessages,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    )

    const data = await response.json()
    
    if (data.error) {
      console.error('Gemini API error:', data.error)
      return NextResponse.json({ error: `Gemini: ${data.error.message || JSON.stringify(data.error)}` }, { status: 500 })
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I could not generate a response.'

    return NextResponse.json({ response: text })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 })
  }
}
