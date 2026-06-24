export function normalizeChecklistItem(item = {}) {
  const title = item.title ?? item.text ?? 'Item'
  const completed = Boolean(item.completed ?? item.checked)

  return {
    ...item,
    title,
    text: title,
    completed,
    checked: completed,
    assignee: item.assignee ?? null,
    assigneeUserId: item.assigneeUserId ?? item.assignee?.id ?? null,
    startAt: item.startAt ?? null,
    dueAt: item.dueAt ?? null,
  }
}

export function normalizeChecklist(checklist) {
  if (!checklist) {
    return null
  }

  return {
    ...checklist,
    title: checklist.title ?? 'Checklist',
    items: Array.isArray(checklist.items) ? checklist.items.map(normalizeChecklistItem) : [],
  }
}

export function buildInitialChecklist(card) {
  const [firstChecklist] = Array.isArray(card.checklists) ? card.checklists : []
  return normalizeChecklist(firstChecklist ?? null)
}

export function getChecklistAssigneeName(item) {
  return item.assignee?.fullName ?? item.assignee?.name ?? item.assignee?.email ?? ''
}
