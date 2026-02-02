import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'edge'

function getDb() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) return null
  return neon(dbUrl)
}

// GET - Fetch all leads
export async function GET() {
  try {
    const sql = getDb()
    if (!sql) {
      return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
    }
    
    const leads = await sql`
      SELECT * FROM mxdr_leads 
      ORDER BY created_at DESC 
      LIMIT 100
    `
    
    return NextResponse.json({ leads })
  } catch (error) {
    console.error('Failed to fetch leads:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update lead status
export async function PATCH(request) {
  try {
    const { id, status, assigned_to, notes } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
    }
    
    const sql = getDb()
    if (!sql) {
      return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
    }
    
    // Build update dynamically
    const updates = []
    const values = []
    
    if (status) {
      await sql`UPDATE mxdr_leads SET status = ${status} WHERE id = ${id}::uuid`
    }
    
    if (assigned_to !== undefined) {
      await sql`UPDATE mxdr_leads SET assigned_to = ${assigned_to} WHERE id = ${id}::uuid`
    }
    
    if (notes !== undefined) {
      await sql`UPDATE mxdr_leads SET notes = ${notes} WHERE id = ${id}::uuid`
    }
    
    // Update last_contacted_at if status changed to contacted
    if (status === 'contacted') {
      await sql`UPDATE mxdr_leads SET last_contacted_at = NOW() WHERE id = ${id}::uuid`
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update lead:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
