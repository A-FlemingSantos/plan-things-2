const RELATIVE_UNITS = [
  { limit: 60, divisor: 1, unit: 'segundo' },
  { limit: 3600, divisor: 60, unit: 'minuto' },
  { limit: 86400, divisor: 3600, unit: 'hora' },
  { limit: 2592000, divisor: 86400, unit: 'dia' },
  { limit: 31536000, divisor: 2592000, unit: 'mês' },
]

/**
 * Minimal pt-BR relative time formatter ("há 3 dias"), avoiding a hard
 * dependency on a date library for this presentational-only panel.
 * @param {string|undefined} isoDate
 */
export function formatGitHubRelativeTime(isoDate) {
  if (!isoDate) return null

  const timestamp = new Date(isoDate).getTime()
  if (Number.isNaN(timestamp)) return null

  const diffSeconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000))
  if (diffSeconds < 30) return 'agora mesmo'

  for (const { limit, divisor, unit } of RELATIVE_UNITS) {
    if (diffSeconds < limit) {
      const value = Math.max(1, Math.round(diffSeconds / divisor))
      const plural = value > 1 ? (unit === 'mês' ? 'meses' : `${unit}s`) : unit
      return `há ${value} ${plural}`
    }
  }

  const years = Math.round(diffSeconds / 31536000)
  return `há ${years} ${years > 1 ? 'anos' : 'ano'}`
}

/**
 * Returns the GitHub-native origin timestamp for relative display in linked items.
 * Uses creation/commit time from the item or its persisted snapshot — never link sync time.
 * @param {{ type?: string, createdAt?: string, updatedAt?: string, committedAt?: string, lastCommitAt?: string } | undefined} item
 */
export function getGitHubItemOriginTime(item) {
  if (!item) return null

  switch (item.type) {
    case 'commit':
      return item.committedAt ?? item.createdAt ?? null
    case 'branch':
      return item.lastCommitAt ?? item.createdAt ?? null
    case 'issue':
    case 'pull_request':
      return item.createdAt ?? item.updatedAt ?? null
    default:
      return item.createdAt ?? item.committedAt ?? item.lastCommitAt ?? null
  }
}

/**
 * @param {{ additions?: number, deletions?: number, changedFiles?: number } | undefined} diffStat
 */
export function formatGitHubDiffStat(diffStat) {
  if (!diffStat) return null
  const { additions = 0, deletions = 0, changedFiles = 0 } = diffStat
  return { additions, deletions, changedFiles }
}
