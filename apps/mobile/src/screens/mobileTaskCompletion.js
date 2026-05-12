export function isLegacyDoneColumn(column) {
  return Boolean(column?.title?.toLowerCase().includes('conclu'))
}

export function isTaskDone(card, column) {
  if (card?.isCompleted != null) {
    return Boolean(card.isCompleted)
  }

  if (card?.completed != null) {
    return Boolean(card.completed)
  }

  return isLegacyDoneColumn(column)
}

export function buildTaskCompletionPatch(card, column) {
  const nextCompleted = !isTaskDone(card, column)

  return {
    isCompleted: nextCompleted,
    completed: nextCompleted,
  }
}
