/** Synthetic, non-operational document fixtures for the AI Lab procedure journey. */

export type ProcedureConditions = {
  selected: 'approved' | 'draft'
  conflict: boolean
  connected: boolean
  approvalRemoved: boolean
}

export const PROCEDURE_INITIAL: ProcedureConditions = {
  selected: 'approved',
  conflict: false,
  connected: true,
  approvalRemoved: false,
}

export const PROCEDURE_DOCUMENTS = [
  {
    id: 'PX-014',
    revision: 'C',
    title: 'Equipment record verification',
    issued: '2026-10-12',
    status: 'Approved',
    body: [
      'Before recording an equipment check, confirm the asset identifier against the site register.',
      'Record the check time, the register revision consulted and any item that could not be verified.',
      'A second authorised reviewer confirms the record before it is filed.',
    ],
  },
  {
    id: 'PX-014',
    revision: 'D',
    title: 'Equipment record verification',
    issued: '2026-10-17',
    status: 'Draft — not approved',
    body: [
      'Draft proposal: include the register location in each equipment check record.',
      'This revision has not been approved and does not replace the current controlled document.',
    ],
  },
] as const

export type ProcedureResult = {
  status: 'ready' | 'review' | 'attention'
  headline: string
  detail: string
  authority: string
  sourceRevision: string | null
  cacheLabel: string
  canUseAsCurrent: boolean
}

/** Selects a fixture outcome; it never merges, promotes or edits document content. */
export function deriveProcedure(conditions: ProcedureConditions): ProcedureResult {
  const cacheLabel = conditions.connected
    ? 'Register connection: online'
    : 'Cached copy · snapshot 18 Oct 2026, 06:00 UTC · two hours old in the fictional scenario · current status cannot be confirmed offline'

  if (!conditions.connected) {
    return {
      status: 'attention',
      headline: 'Unable to confirm the current revision',
      detail: 'The endpoint has a dated cached copy of synthetic PX-014 revision C. Check the central register and verify applicability before use.',
      authority: 'Central document register (synthetic authority)',
      sourceRevision: 'C',
      cacheLabel,
      canUseAsCurrent: false,
    }
  }

  if (conditions.conflict) {
    return {
      status: 'attention',
      headline: 'Conflicting records need document control review',
      detail: 'The synthetic records disagree. No instructions have been combined; confirm the controlled revision with the document controller.',
      authority: 'Central document register (synthetic authority)',
      sourceRevision: null,
      cacheLabel,
      canUseAsCurrent: false,
    }
  }

  if (conditions.approvalRemoved) {
    return {
      status: 'attention',
      headline: 'Approval has been removed',
      detail: 'Revision C is no longer represented as approved in this fixture. Ask the document controller to confirm the current controlled record.',
      authority: 'Central document register (synthetic authority)',
      sourceRevision: null,
      cacheLabel,
      canUseAsCurrent: false,
    }
  }

  if (conditions.selected === 'draft') {
    return {
      status: 'review',
      headline: 'Revision D is a draft',
      detail: 'Its newer issue date does not grant approval. Revision D cannot be used as the current controlled answer.',
      authority: 'Central document register (synthetic authority)',
      sourceRevision: 'D',
      cacheLabel,
      canUseAsCurrent: false,
    }
  }

  return {
    status: 'ready',
    headline: 'Approved fixture revision C is available',
    detail: 'This is original synthetic, non-operational example text. A worker still verifies document ID, revision and applicability with the central register.',
    authority: 'Central document register (synthetic authority)',
    sourceRevision: 'C',
    cacheLabel,
    canUseAsCurrent: true,
  }
}
