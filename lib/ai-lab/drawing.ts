/** Original synthetic drawing metadata for the energy drawing-search example. */

export type DrawingConditions = {
  scan: 'clear' | 'poor' | 'missing'
  rotated: boolean
  selected: 'current' | 'older'
  connected: boolean
}

export const DRAWING_INITIAL: DrawingConditions = {
  scan: 'clear',
  rotated: false,
  selected: 'current',
  connected: true,
}

export const DRAWINGS = [
  { id: 'DW-021', asset: 'WT-01', revision: 'B', title: 'Treatment assembly layout', issued: '2026-10-16', status: 'Approved' },
  { id: 'DW-021', asset: 'WT-01', revision: 'A', title: 'Treatment assembly layout', issued: '2026-05-12', status: 'Superseded' },
] as const

type DrawingField = {
  key: 'drawing' | 'asset' | 'revision'
  label: string
  value: string | null
  source: string
}

export type DrawingResult = {
  status: 'ready' | 'review' | 'attention'
  headline: string
  detail: string
  fields: DrawingField[]
  canUseAsCurrent: boolean
  register: string
  nextCheck: string
  cloud: string
}

/** Scripted extraction from labelled fictional title-block regions; no OCR is run. */
export function deriveDrawing(c: DrawingConditions): DrawingResult {
  const drawing = c.selected === 'current' ? DRAWINGS[0] : DRAWINGS[1]
  const readableId = true
  const readableAsset = c.scan === 'clear'
  const readableRevision = c.scan !== 'poor'
  const orientation = c.rotated ? (c.scan === 'clear' ? ' The scan is rotated; the labelled fields remain readable in this example.' : ' The scan is rotated; rotation does not restore absent or unreadable fields.') : ''
  const fields: DrawingField[] = [
    { key: 'drawing', label: 'Drawing ID', value: readableId ? drawing.id : null, source: 'Title-block region · drawing identifier' },
    { key: 'asset', label: 'Asset', value: readableAsset ? drawing.asset : null, source: 'Title-block region · asset identifier' },
    { key: 'revision', label: 'Revision', value: readableRevision ? drawing.revision : null, source: 'Title-block region · revision field' },
  ]
  const register = c.connected
    ? 'Fictional central drawing register: connected; revision B is Approved and revision A is Superseded.'
    : 'Offline site pack · register snapshot 2026-10-16 06:00 UTC. Cached metadata only; current register status cannot be confirmed.'
  const cloud = c.connected
    ? 'Illustrative central indexing is available; no image is transmitted and no model inference occurs.'
    : 'Illustrative cloud indexing is unavailable; no image is transmitted and no model inference occurs.'
  const nextCheck = 'Reviewer confirms the displayed metadata against the drawing register; maintainer verifies that the drawing applies to the intended work.'

  if (!c.connected) {
    return {
      status: 'attention', headline: 'Current register status cannot be confirmed',
      detail: `The dated offline pack identifies a fictional drawing record, but a cached issue date and filename do not establish the latest approved revision.${orientation}`,
      fields, canUseAsCurrent: false, register, nextCheck, cloud,
    }
  }
  if (c.scan === 'missing') {
    return {
      status: 'attention', headline: 'Asset field is absent from the scan',
      detail: `The drawing ID remains readable, but the asset identifier is missing and applicability cannot be established.${orientation}`,
      fields, canUseAsCurrent: false, register, nextCheck, cloud,
    }
  }
  if (c.scan === 'poor') {
    return {
      status: 'review', headline: 'Some title-block fields are unreadable',
      detail: `The drawing ID is readable; asset and revision remain unknown. The register shows possible revisions but cannot fill unreadable scan fields.${orientation}`,
      fields, canUseAsCurrent: false, register, nextCheck, cloud,
    }
  }
  if (c.selected === 'older') {
    return {
      status: 'attention', headline: 'Revision A is superseded',
      detail: `The scan supports the displayed title-block fields, while the register marks this record Superseded. A later-looking filename or issue date alone does not establish authority.${orientation}`,
      fields, canUseAsCurrent: false, register, nextCheck, cloud,
    }
  }
  return {
    status: 'ready', headline: 'Revision B matches the approved register entry',
      detail: `The scripted extraction is supported by the labelled title-block regions; this is source-supported example data, not OCR. The connected fictional register marks B Approved.${orientation}`,
    fields, canUseAsCurrent: true, register, nextCheck, cloud,
  }
}
