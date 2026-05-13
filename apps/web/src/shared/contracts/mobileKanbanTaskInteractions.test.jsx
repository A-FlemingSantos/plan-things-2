import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}))

const { interactivePointerEventsStyle, resolveInteractivePointerEventsStyle, withPlatformPointerEvents } = await import('../../../../mobile/src/theme/platformRuntime.js')
const { buildTaskCompletionPatch, isTaskDone } = await import('../../../../mobile/src/screens/mobileTaskCompletion.js')
const { buildBoardCardPayload, mapBoardCard } = await import('../../../../../packages/shared-client/src/board.js')

describe('mobile kanban task interactions', () => {
  it('maps box-none overlays to valid web pointer events while leaving children opt-in interactive', () => {
    expect(withPlatformPointerEvents({ bottom: 80 }, 'box-none')).toEqual({
      style: [
        { bottom: 80 },
        { pointerEvents: 'none' },
      ],
    })
    expect(interactivePointerEventsStyle).toEqual({ pointerEvents: 'auto' })
  })

  it('keeps the files overlay non-interactive while the add sheet is closed', () => {
    expect(resolveInteractivePointerEventsStyle(false)).toBeNull()
    expect(resolveInteractivePointerEventsStyle(true)).toEqual({ pointerEvents: 'auto' })
  })

  it('keeps the mobile board card star in the shared payload contract', () => {
    const mappedCard = mapBoardCard({
      id: 'card-1',
      columnId: 'col-1',
      title: 'Tarefa',
      description: '',
      completed: true,
      starred: true,
      label: null,
      assignees: [],
      dueAt: null,
      startAt: null,
      comments: [],
      attachments: [],
      kind: 'TAREFA',
      checklists: [],
    })

    expect(mappedCard.isCompleted).toBe(true)
    expect(mappedCard.starred).toBe(true)
    expect(isTaskDone(mappedCard, { title: 'Backlog' })).toBe(true)

    expect(buildBoardCardPayload({
      ...mappedCard,
      memberIds: [],
      schedule: {
        startEnabled: false,
        dueEnabled: false,
      },
    })).toMatchObject({
      completed: true,
      starred: true,
    })
  })

  it('builds a completion patch from card state instead of relying on the column title', () => {
    expect(isTaskDone({ isCompleted: false }, { title: 'Fazer' })).toBe(false)
    expect(buildTaskCompletionPatch({ isCompleted: false }, { title: 'Fazer' })).toEqual({
      isCompleted: true,
      completed: true,
    })
  })
})
