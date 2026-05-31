import {
  buildWorkspaceBoardCardPath,
  buildWorkspaceBoardPath,
  buildWorkspaceFilePath,
} from '../../../../shared/config/routes.js'

export function isReferenceUnavailable(block = {}) {
  const snapshot = block.snapshot ?? block.payload?.snapshot ?? {}
  return Boolean(snapshot.unavailable)
}

export function resolveReferenceHref(block = {}) {
  const href = block.href ?? block.payload?.href ?? null
  if (href) return href

  const blockType = String(block.type ?? '').toUpperCase()
  const entityId = block.entityId ?? block.payload?.entityId ?? null

  if (blockType === 'PLAN_REFERENCE' && entityId) {
    return buildWorkspaceBoardPath(entityId)
  }

  if (blockType === 'CARD_REFERENCE' && entityId) {
    const planId = block.payload?.parentEntityId ?? null
    if (planId) return buildWorkspaceBoardCardPath(planId, entityId)
  }

  if (blockType === 'FILE_REFERENCE' && entityId) {
    return buildWorkspaceFilePath(entityId)
  }

  return null
}

export function resolveReferenceTitle(block = {}, fallback = 'Referência') {
  const snapshot = block.snapshot ?? block.payload?.snapshot ?? {}
  return String(block.title ?? snapshot.title ?? fallback).trim() || fallback
}

export function resolveReferenceSubtitle(block = {}) {
  const snapshot = block.snapshot ?? block.payload?.snapshot ?? {}
  return String(snapshot.subtitle ?? '').trim()
}

export function resolveReferenceStatusLabel(block = {}) {
  const snapshot = block.snapshot ?? block.payload?.snapshot ?? {}
  return String(snapshot.statusLabel ?? '').trim()
}
