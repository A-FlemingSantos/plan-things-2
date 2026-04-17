import { describe, expect, it } from 'vitest'
import { mapCalendarEventsToSnapshot } from './backendAdapters.js'

describe('mapCalendarEventsToSnapshot', () => {
  it('pins generated tasks to the due day instead of the synthetic start day', () => {
    const snapshot = mapCalendarEventsToSnapshot([
      {
        id: 'task-1',
        title: 'Virada da madrugada',
        generatedFromCard: true,
        cardKind: 'TAREFA',
        startsAt: { iso: '2026-04-19T23:30:00-03:00', text: '19/04/2026 23:30' },
        endsAt: { iso: '2026-04-20T00:30:00-03:00', text: '20/04/2026 00:30' },
      },
    ])

    expect(snapshot.events[0]).toMatchObject({
      date: '2026-04-20',
      start: '23:30',
      end: '00:30',
      cardKind: 'TAREFA',
    })
  })

  it('keeps generated plan events anchored to the start day', () => {
    const snapshot = mapCalendarEventsToSnapshot([
      {
        id: 'event-1',
        title: 'Evento do plano',
        generatedFromCard: true,
        cardKind: 'EVENTO',
        startsAt: { iso: '2026-04-20T13:00:00-03:00', text: '20/04/2026 13:00' },
        endsAt: { iso: '2026-04-20T14:00:00-03:00', text: '20/04/2026 14:00' },
      },
    ])

    expect(snapshot.events[0]).toMatchObject({
      date: '2026-04-20',
      start: '13:00',
      end: '14:00',
      cardKind: 'EVENTO',
    })
  })
})
