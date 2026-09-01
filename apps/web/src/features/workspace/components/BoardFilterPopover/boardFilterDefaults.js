export const BOARD_FILTER_MATCH_MODES = [
  { id: 'any', label: 'Qualquer correspondência' },
  { id: 'all', label: 'Todas as correspondências' },
]

export const BOARD_FILTER_DEFAULTS = {
  keyword: '',
  members: {
    noMembers: false,
    assignedToMe: false,
    selectedMemberIds: [],
  },
  status: {
    completed: false,
    notCompleted: false,
  },
  dueDate: {
    noDates: false,
    overdue: false,
    dueInDay: false,
    dueInWeek: false,
    dueInMonth: false,
  },
  labels: {
    noLabels: false,
    selectedLabelIds: [],
  },
  activity: {
    activeLastWeek: false,
    activeLastTwoWeeks: false,
    activeLastFourWeeks: false,
    noActivityLastFourWeeks: false,
  },
  matchMode: 'any',
}

function hasTruthyValues(values = {}) {
  return Object.values(values).some((value) => {
    if (Array.isArray(value)) return value.length > 0
    return Boolean(value)
  })
}

export function hasActiveBoardFilters(filter = BOARD_FILTER_DEFAULTS) {
  if (!filter) return false
  if (filter.keyword?.trim()) return true
  if (hasTruthyValues(filter.members)) return true
  if (hasTruthyValues(filter.status)) return true
  if (hasTruthyValues(filter.dueDate)) return true
  if (hasTruthyValues(filter.labels)) return true
  if (hasTruthyValues(filter.activity)) return true
  return false
}

export function toggleBoardFilterMemberId(filter, memberId) {
  const selected = new Set(filter.members.selectedMemberIds)
  if (selected.has(memberId)) {
    selected.delete(memberId)
  } else {
    selected.add(memberId)
  }
  return {
    ...filter,
    members: {
      ...filter.members,
      selectedMemberIds: [...selected],
    },
  }
}

export function toggleBoardFilterLabelId(filter, labelId) {
  const selected = new Set(filter.labels.selectedLabelIds)
  if (selected.has(labelId)) {
    selected.delete(labelId)
  } else {
    selected.add(labelId)
  }
  return {
    ...filter,
    labels: {
      ...filter.labels,
      selectedLabelIds: [...selected],
    },
  }
}
