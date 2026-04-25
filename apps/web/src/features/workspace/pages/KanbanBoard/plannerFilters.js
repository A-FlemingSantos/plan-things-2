const LOCALE = 'pt-BR'

function compareNullableStrings(left, right) {
  if (!left && !right) return 0
  if (!left) return 1
  if (!right) return -1
  return left.localeCompare(right, LOCALE)
}

export function diffDaysFromDateKeys(targetKey, baseKey) {
  if (!targetKey || !baseKey) return null
  const [targetYear, targetMonth, targetDay] = targetKey.split('-').map(Number)
  const [baseYear, baseMonth, baseDay] = baseKey.split('-').map(Number)
  if (![targetYear, targetMonth, targetDay, baseYear, baseMonth, baseDay].every(Number.isFinite)) return null

  const targetUtc = Date.UTC(targetYear, targetMonth - 1, targetDay, 12, 0, 0, 0)
  const baseUtc = Date.UTC(baseYear, baseMonth - 1, baseDay, 12, 0, 0, 0)
  return Math.round((targetUtc - baseUtc) / 86400000)
}

export function filterPlannerItems(baseItems, filterId, todayKey) {
  if (!Array.isArray(baseItems)) return []

  switch (filterId) {
    case 'my-day':
      return baseItems.filter((item) => {
        if (item.type === 'event') return item.scheduleKey === todayKey
        if (item.type !== 'card') return false
        return item.startKey === todayKey || item.dueKey === todayKey
      })
    case 'important':
      return baseItems.filter((item) => item.pinned)
    case 'planned':
      return baseItems.filter((item) => {
        if (!item.scheduleKey) return false
        if (item.type === 'card' && item.isCompleted) return false
        const diffDays = diffDaysFromDateKeys(item.scheduleKey, todayKey)
        return typeof diffDays === 'number' && diffDays >= 0
      })
    case 'completed':
      return baseItems.filter((item) => item.type === 'card' && item.isCompleted)
    case 'assigned-to-me':
      return baseItems.filter((item) => item.type === 'card' && item.isAssignedToMe)
    default:
      return baseItems
  }
}

export function sortPlannerItems(items) {
  const copy = Array.isArray(items) ? [...items] : []
  copy.sort((left, right) => {
    const scheduleCompare = compareNullableStrings(left.scheduleKey, right.scheduleKey)
    if (scheduleCompare) return scheduleCompare

    const leftMinutes = Number.isFinite(left.timeMinutes) ? left.timeMinutes : 99999
    const rightMinutes = Number.isFinite(right.timeMinutes) ? right.timeMinutes : 99999
    if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes

    return (left.title ?? '').localeCompare(right.title ?? '', LOCALE)
  })
  return copy
}

function plannedBucketForDiffDays(diffDays) {
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays >= 2 && diffDays <= 28) return 'next'
  if (diffDays > 28) return 'later'
  return null
}

export function buildPlannerView({ baseItems, filterId, todayKey }) {
  const filtered = filterPlannerItems(baseItems, filterId, todayKey)

  if (filterId === 'my-day') {
    const completed = filtered.filter((item) => item.type === 'card' && item.isCompleted)
    const open = filtered.filter((item) => !(item.type === 'card' && item.isCompleted))

    return {
      ungroupedItems: sortPlannerItems(open),
      sections: completed.length
        ? [{
            id: 'my-day:completed',
            title: 'Concluída',
            items: sortPlannerItems(completed),
          }]
        : [],
    }
  }

  if (filterId === 'planned') {
    const byBucket = {
      today: [],
      tomorrow: [],
      next: [],
      later: [],
    }

    filtered.forEach((item) => {
      const diffDays = diffDaysFromDateKeys(item.scheduleKey, todayKey)
      const bucket = plannedBucketForDiffDays(diffDays)
      if (!bucket) return
      byBucket[bucket].push(item)
    })

    const sections = []
    if (byBucket.today.length) {
      sections.push({ id: 'planned:today', title: 'Hoje', items: sortPlannerItems(byBucket.today) })
    }
    if (byBucket.tomorrow.length) {
      sections.push({ id: 'planned:tomorrow', title: 'Amanhã', items: sortPlannerItems(byBucket.tomorrow) })
    }
    if (byBucket.next.length) {
      sections.push({ id: 'planned:next', title: 'Próximos dias', items: sortPlannerItems(byBucket.next) })
    }
    if (byBucket.later.length) {
      sections.push({ id: 'planned:later', title: 'Mais tarde', items: sortPlannerItems(byBucket.later) })
    }

    return { ungroupedItems: [], sections }
  }

  return {
    ungroupedItems: sortPlannerItems(filtered),
    sections: [],
  }
}

