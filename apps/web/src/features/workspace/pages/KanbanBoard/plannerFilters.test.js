import { describe, expect, it } from 'vitest'
import { buildPlannerView, filterPlannerItems } from './plannerFilters.js'

describe('plannerFilters', () => {
  it('Planejado partitions by 2/28/29 day boundaries, excludes past and completed', () => {
    const todayKey = '2026-04-21'
    const baseItems = [
      { id: 'past', type: 'event', pinned: false, scheduleKey: '2026-04-20', timeMinutes: 10, title: 'Past' },
      { id: 'today', type: 'event', pinned: false, scheduleKey: '2026-04-21', timeMinutes: 10, title: 'Today' },
      { id: 'tomorrow', type: 'event', pinned: false, scheduleKey: '2026-04-22', timeMinutes: 10, title: 'Tomorrow' },
      { id: 'd2', type: 'event', pinned: false, scheduleKey: '2026-04-23', timeMinutes: 10, title: 'In 2 days' },
      { id: 'd28', type: 'event', pinned: false, scheduleKey: '2026-05-19', timeMinutes: 10, title: 'In 28 days' },
      { id: 'd29', type: 'event', pinned: false, scheduleKey: '2026-05-20', timeMinutes: 10, title: 'In 29 days' },
      { id: 'done', type: 'card', pinned: false, scheduleKey: '2026-04-23', timeMinutes: 10, title: 'Done', isCompleted: true },
    ]

    const planned = filterPlannerItems(baseItems, 'planned', todayKey)
    expect(planned.map((item) => item.id)).toEqual(['today', 'tomorrow', 'd2', 'd28', 'd29'])

    const view = buildPlannerView({ baseItems, filterId: 'planned', todayKey })
    expect(view.sections.map((section) => section.id)).toEqual(['planned:today', 'planned:tomorrow', 'planned:next', 'planned:later'])
    expect(view.sections.find((s) => s.id === 'planned:today').items.map((i) => i.id)).toEqual(['today'])
    expect(view.sections.find((s) => s.id === 'planned:tomorrow').items.map((i) => i.id)).toEqual(['tomorrow'])
    expect(view.sections.find((s) => s.id === 'planned:next').items.map((i) => i.id)).toEqual(['d2', 'd28'])
    expect(view.sections.find((s) => s.id === 'planned:later').items.map((i) => i.id)).toEqual(['d29'])
  })

  it('Meu Dia splits completed cards into a Concluída section', () => {
    const todayKey = '2026-04-21'
    const baseItems = [
      { id: 'c1', type: 'card', pinned: false, startKey: todayKey, dueKey: null, scheduleKey: todayKey, timeMinutes: 20, title: 'Open', isCompleted: false },
      { id: 'c2', type: 'card', pinned: false, startKey: null, dueKey: todayKey, scheduleKey: todayKey, timeMinutes: 10, title: 'Done', isCompleted: true },
      { id: 'e1', type: 'event', pinned: false, scheduleKey: todayKey, timeMinutes: 5, title: 'Event' },
      { id: 'other', type: 'event', pinned: false, scheduleKey: '2026-04-22', timeMinutes: 5, title: 'Other' },
    ]

    const view = buildPlannerView({ baseItems, filterId: 'my-day', todayKey })
    expect(view.ungroupedItems.map((i) => i.id)).toEqual(['e1', 'c1'])
    expect(view.sections).toHaveLength(1)
    expect(view.sections[0].id).toBe('my-day:completed')
    expect(view.sections[0].items.map((i) => i.id)).toEqual(['c2'])
  })

  it('Importante includes cards and events when pinned', () => {
    const todayKey = '2026-04-21'
    const baseItems = [
      { id: 'pinned-card', type: 'card', pinned: true, scheduleKey: null, timeMinutes: null, title: 'Card', isCompleted: false },
      { id: 'pinned-event', type: 'event', pinned: true, scheduleKey: todayKey, timeMinutes: 5, title: 'Event' },
      { id: 'not', type: 'event', pinned: false, scheduleKey: todayKey, timeMinutes: 1, title: 'No' },
    ]

    const view = buildPlannerView({ baseItems, filterId: 'important', todayKey })
    expect(view.ungroupedItems.map((i) => i.id)).toEqual(['pinned-event', 'pinned-card'])
  })
})

