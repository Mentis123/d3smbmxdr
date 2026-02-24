import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'edge'

function getDb() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) return null
  return neon(dbUrl)
}

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS page_edits (
      page_id     VARCHAR(64)  NOT NULL,
      block_id    VARCHAR(128) NOT NULL,
      content     TEXT,
      deleted     BOOLEAN      DEFAULT FALSE,
      updated_at  TIMESTAMP    DEFAULT NOW(),
      updated_by  VARCHAR(100),
      PRIMARY KEY (page_id, block_id)
    )
  `
}

// GET - Fetch all edits for a page
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('page_id')

    if (!pageId) {
      return NextResponse.json({ error: 'page_id required' }, { status: 400 })
    }

    const sql = getDb()
    if (!sql) {
      return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
    }

    await ensureTable(sql)

    const rows = await sql`
      SELECT block_id, content, deleted, updated_at
      FROM page_edits
      WHERE page_id = ${pageId}
    `

    const edits = {}
    for (const row of rows) {
      edits[row.block_id] = {
        content: row.content,
        deleted: row.deleted,
        updated_at: row.updated_at
      }
    }

    return NextResponse.json({ edits })
  } catch (error) {
    console.error('Failed to fetch page edits:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Upsert a single block edit
export async function PUT(request) {
  try {
    const { page_id, block_id, content, deleted } = await request.json()

    if (!page_id || !block_id) {
      return NextResponse.json({ error: 'page_id and block_id required' }, { status: 400 })
    }

    const sql = getDb()
    if (!sql) {
      return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
    }

    await ensureTable(sql)

    const isDeleted = deleted === true
    const contentVal = content !== undefined ? content : null

    await sql`
      INSERT INTO page_edits (page_id, block_id, content, deleted, updated_at)
      VALUES (${page_id}, ${block_id}, ${contentVal}, ${isDeleted}, NOW())
      ON CONFLICT (page_id, block_id)
      DO UPDATE SET
        content = ${contentVal},
        deleted = ${isDeleted},
        updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save page edit:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
