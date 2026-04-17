import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-static'

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'data3-brand-guidelines.skill')
  const file = await readFile(filePath)
  return new Response(file, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="data3-brand-guidelines.skill"',
      'Content-Length': String(file.length),
    },
  })
}
