const STORAGE_PREFIX = 'plan-things:recent-plans:v1'
const MAX_RECENT_PLANS = 8

function buildStorageKey(userId) {
  if (!userId) return null
  return `${STORAGE_PREFIX}:${userId}`
}

function readRawEntries(userId) {
  const storageKey = buildStorageKey(userId)
  if (!storageKey || typeof window === 'undefined') return []

  try {
    const rawValue = window.localStorage.getItem(storageKey)
    if (!rawValue) return []

    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((entry) => (typeof entry === 'string' ? entry : entry?.planId))
      .filter((planId) => typeof planId === 'string' && planId.length > 0)
  } catch {
    return []
  }
}

function writeRawEntries(userId, planIds) {
  const storageKey = buildStorageKey(userId)
  if (!storageKey || typeof window === 'undefined') return planIds

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(planIds))
  } catch {
    // Ignore quota or privacy-mode failures.
  }

  return planIds
}

export function readRecentPlanIds(userId) {
  return readRawEntries(userId).slice(0, MAX_RECENT_PLANS)
}

export function recordRecentPlan(userId, planId) {
  if (!userId || !planId) return readRecentPlanIds(userId)

  const nextPlanIds = [
    planId,
    ...readRawEntries(userId).filter((entry) => entry !== planId),
  ].slice(0, MAX_RECENT_PLANS)

  return writeRawEntries(userId, nextPlanIds)
}

export function removeRecentPlan(userId, planId) {
  if (!userId || !planId) return readRecentPlanIds(userId)

  const nextPlanIds = readRawEntries(userId).filter((entry) => entry !== planId)
  return writeRawEntries(userId, nextPlanIds)
}
