// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  buildBoardCardPayload,
  buildCalendarEventPayload,
  mapCalendarEventsToSnapshot,
  mapBoardViewToColumns,
  mapPlanSummaryToRecord,
} from './backendAdapters.js'

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

  it('maps date and hour using the configured timezone', () => {
    const snapshot = mapCalendarEventsToSnapshot([
      {
        id: 'task-2',
        title: 'Virada com timezone preferido',
        generatedFromCard: true,
        cardKind: 'TAREFA',
        startsAt: { iso: '2026-04-20T02:30:00Z' },
        endsAt: { iso: '2026-04-20T04:30:00Z' },
      },
    ], {
      timeZone: 'America/New_York',
    })

    expect(snapshot.events[0]).toMatchObject({
      date: '2026-04-20',
      start: '22:30',
      end: '00:30',
    })
  })
})

describe('mapPlanSummaryToRecord cover images', () => {
  it('resolves uploaded plan cover files to authenticated download urls', () => {
    const plan = mapPlanSummaryToRecord({
      id: 'plan-1',
      name: 'Test',
      coverImageId: 'files/abc-123',
      role: 'OWNER',
      memberCount: 1,
      taskCount: 0,
    })

    expect(plan.coverImage).toBe('/api/files/abc-123/download')
    expect(plan.coverImageThumb).toBe('/api/files/abc-123/download')
  })
})

describe('timezone-aware payload serializers', () => {
  it('serializes calendar payload with the preferred timezone offset', () => {
    const payload = buildCalendarEventPayload(
      {
        title: 'Review semanal',
        date: '2026-06-15',
        start: '09:00',
        end: '10:00',
      },
      {
        timeZone: 'America/New_York',
      },
    )

    expect(payload.startsAt).toBe('2026-06-15T09:00:00-04:00')
    expect(payload.endsAt).toBe('2026-06-15T10:00:00-04:00')
  })

  it('serializes board card payload with explicit date format and timezone', () => {
    const payload = buildBoardCardPayload(
      {
        columnId: 'col-1',
        title: 'Card 1',
        description: '',
        starred: true,
        memberIds: [],
        labelId: null,
        schedule: {
          startEnabled: false,
          dueEnabled: true,
          dueDateValue: '06/15/2026',
          dueTimeValue: '14:30',
        },
      },
      {
        dateFormat: 'MM/dd/yyyy',
        timeZone: 'America/New_York',
      },
    )

    expect(payload.dueAt).toBe('2026-06-15T14:30:00-04:00')
    expect(payload.starred).toBe(true)
  })
})

describe('board mapping with preferences', () => {
  const sampleBoardView = {
    columns: [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '#a0a0a0',
        cards: [
          {
            id: 'card-1',
            columnId: 'col-1',
            title: 'Card timezone',
            description: '',
            starred: true,
            label: null,
            assignees: [],
            startAt: null,
            dueAt: { iso: '2026-04-20T03:30:00Z', text: '20/04/2026 03:30 UTC' },
            comments: [],
            kind: 'TAREFA',
            checklists: [],
            attachments: [
              {
                id: 'att-1',
                fileId: 'file-1',
                name: 'briefing.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 2048,
                attachedBy: { id: 'user-1', fullName: 'Owner', email: 'owner@example.com' },
                attachedByCurrentUser: true,
                canRemove: true,
                createdAt: { iso: '2026-04-20T03:30:00Z', text: '20/04/2026 03:30 UTC' },
              },
            ],
          },
        ],
      },
    ],
    labels: [],
  }

  it('hydrates board schedule values using timezone and date format options', () => {
    const [column] = mapBoardViewToColumns(sampleBoardView, {
      timeZone: 'America/New_York',
      dateFormat: 'MM/dd/yyyy',
      locale: 'en-US',
    })
    const [card] = column.cards

    expect(card.schedule.dueDateValue).toBe('04/19/2026')
    expect(card.schedule.dueTimeValue).toBe('23:30')
    expect(card.schedule.selectedCalendarDay).toBe(19)
  })

  it('keeps instant stable in board roundtrip when using the same preferences', () => {
    const [column] = mapBoardViewToColumns(sampleBoardView, {
      timeZone: 'America/New_York',
      dateFormat: 'MM/dd/yyyy',
      locale: 'en-US',
    })
    const [card] = column.cards
    const payload = buildBoardCardPayload(card, {
      timeZone: 'America/New_York',
      dateFormat: 'MM/dd/yyyy',
    })

    expect(payload.dueAt).toBe('2026-04-19T23:30:00-04:00')
  })

  it('maps board card attachments with permission flags', () => {
    const [column] = mapBoardViewToColumns(sampleBoardView)
    const [card] = column.cards

    expect(card.starred).toBe(true)
    expect(card.attachments).toEqual([
      expect.objectContaining({
        id: 'att-1',
        fileId: 'file-1',
        name: 'briefing.pdf',
        type: 'pdf',
        size: 2048,
        attachedByCurrentUser: true,
        canRemove: true,
      }),
    ])
  })
})
