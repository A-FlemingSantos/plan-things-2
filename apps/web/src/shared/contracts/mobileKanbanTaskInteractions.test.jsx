import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}))

const { interactivePointerEventsStyle, withPlatformPointerEvents } = await import('../../../../mobile/src/theme/platformRuntime.js')
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

  it('keeps the mobile board card star in the shared payload contract', () => {
    const mappedCard = mapBoardCard({
      id: 'card-1',
      columnId: 'col-1',
      title: 'Tarefa',
      description: '',
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

    expect(mappedCard.starred).toBe(true)

    expect(buildBoardCardPayload({
      ...mappedCard,
      memberIds: [],
      schedule: {
        startEnabled: false,
        dueEnabled: false,
      },
    })).toMatchObject({
      starred: true,
    })
  })
})
