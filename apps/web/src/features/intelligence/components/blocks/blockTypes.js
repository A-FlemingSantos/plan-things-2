export const PROPOSAL_BLOCK_TYPES = new Set([
  'PLAN_PROPOSAL',
  'CARD_BATCH_PROPOSAL',
  'MEMBER_INVITE_PROPOSAL',
  'FILE_ATTACH_PROPOSAL',
])

export const REFERENCE_BLOCK_TYPES = new Set([
  'PLAN_REFERENCE',
  'CARD_REFERENCE',
  'FILE_REFERENCE',
  'MEMBER_REFERENCE',
  'INBOX_REFERENCE',
  'GITHUB_COMMIT_REFERENCE',
  'GITHUB_PULL_REQUEST_REFERENCE',
])

export function isProposalBlockType(type) {
  return PROPOSAL_BLOCK_TYPES.has(String(type ?? '').toUpperCase())
}

export function isReferenceBlockType(type) {
  return REFERENCE_BLOCK_TYPES.has(String(type ?? '').toUpperCase())
}
