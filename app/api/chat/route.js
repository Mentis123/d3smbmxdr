import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'edge'

export async function POST(request) {
  try {
    const { systemPrompt, messages, leadData } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    const dbUrl = process.env.DATABASE_URL
    const sql = dbUrl ? neon(dbUrl) : null

    if (leadData && sql) {
      try {
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
        `;
      } catch (dbError) {
        console.error('Failed to save lead:', dbError);
      }
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    )

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I could not generate a response.'

    return NextResponse.json({ response: text })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
