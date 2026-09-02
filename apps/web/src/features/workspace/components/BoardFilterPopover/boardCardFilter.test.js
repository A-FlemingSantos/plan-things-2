import { describe, expect, it } from 'vitest'
import { BOARD_FILTER_DEFAULTS } from './boardFilterDefaults.js'
import { cardMatchesBoardFilter, collectMatchingCardIds } from './boardCardFilter.js'

const NOW = Date.parse('2026-09-02T15:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

function filterWith(patch) {
  return {
    ...BOARD_FILTER_DEFAULTS,
    ...patch,
    members: { ...BOARD_FILTER_DEFAULTS.members, ...patch.members },
    status: { ...BOARD_FILTER_DEFAULTS.status, ...patch.status },
    dueDate: { ...BOARD_FILTER_DEFAULTS.dueDate, ...patch.dueDate },
    labels: { ...BOARD_FILTER_DEFAULTS.labels, ...patch.labels },
    activity: { ...BOARD_FILTER_DEFAULTS.activity, ...patch.activity },
  }
}

function card(overrides = {}) {
  return {
    id: 'card-1',
    title: 'Corrigir login',
    description: 'Fluxo de autenticação',
    isCompleted: false,
    labelId: 'feature',
    memberIds: ['u1'],
    dueAt: null,
    comments: [],
    ...overrides,
  }
}

const context = {
  now: NOW,
  currentUserId: 'me',
  labels: [{ id: 'feature', text: 'Feature' }, { id: 'bug', text: 'Bug' }],
  members: [
    { id: 'me', name: 'Arthur' },
    { id: 'u1', name: 'Marina' },
    { id: 'u2', name: 'Tiago' },
  ],
}

describe('cardMatchesBoardFilter', () => {
  it('matches every card when no filter is active', () => {
    expect(cardMatchesBoardFilter(card(), BOARD_FILTER_DEFAULTS, context)).toBe(true)
  })

  it('filters by keyword across title, description, labels, and members', () => {
    expect(cardMatchesBoardFilter(card(), filterWith({ keyword: 'login' }), context)).toBe(true)
    expect(cardMatchesBoardFilter(card(), filterWith({ keyword: 'autent' }), context)).toBe(true)
    expect(cardMatchesBoardFilter(card(), filterWith({ keyword: 'feature' }), context)).toBe(true)
    expect(cardMatchesBoardFilter(card(), filterWith({ keyword: 'marina' }), context)).toBe(true)
    expect(cardMatchesBoardFilter(card(), filterWith({ keyword: 'xyz' }), context)).toBe(false)
  })

  it('filters members with any vs all match modes', () => {
    const assignedToMe = card({ memberIds: ['me'] })
    const both = card({ memberIds: ['me', 'u1'] })
    const empty = card({ memberIds: [] })

    expect(cardMatchesBoardFilter(
      empty,
      filterWith({ members: { noMembers: true } }),
      context,
    )).toBe(true)
    expect(cardMatchesBoardFilter(
      assignedToMe,
      filterWith({ members: { noMembers: true } }),
      context,
    )).toBe(false)

    expect(cardMatchesBoardFilter(
      assignedToMe,
      filterWith({ members: { assignedToMe: true } }),
      context,
    )).toBe(true)

    const selectedAny = filterWith({
      matchMode: 'any',
      members: { selectedMemberIds: ['me', 'u1'] },
    })
    expect(cardMatchesBoardFilter(assignedToMe, selectedAny, context)).toBe(true)
    expect(cardMatchesBoardFilter(card({ memberIds: ['u2'] }), selectedAny, context)).toBe(false)

    const selectedAll = filterWith({
      matchMode: 'all',
      members: { selectedMemberIds: ['me', 'u1'] },
    })
    expect(cardMatchesBoardFilter(both, selectedAll, context)).toBe(true)
    expect(cardMatchesBoardFilter(assignedToMe, selectedAll, context)).toBe(false)
  })

  it('filters completed status only when a single option is selected', () => {
    const done = card({ isCompleted: true })
    const open = card({ isCompleted: false })
    const both = filterWith({ status: { completed: true, notCompleted: true } })

    expect(cardMatchesBoardFilter(done, filterWith({ status: { completed: true } }), context)).toBe(true)
    expect(cardMatchesBoardFilter(open, filterWith({ status: { completed: true } }), context)).toBe(false)
    expect(cardMatchesBoardFilter(open, filterWith({ status: { notCompleted: true } }), context)).toBe(true)
    expect(cardMatchesBoardFilter(done, both, context)).toBe(true)
    expect(cardMatchesBoardFilter(open, both, context)).toBe(true)
  })

  it('filters due-date buckets from now', () => {
    const noDate = card({ dueAt: null })
    const overdue = card({ dueAt: { iso: new Date(NOW - DAY_MS).toISOString() } })
    const tomorrow = card({ dueAt: { iso: new Date(NOW + 12 * 60 * 60 * 1000).toISOString() } })
    const nextWeek = card({ dueAt: { iso: new Date(NOW + 5 * DAY_MS).toISOString() } })
    const nextMonth = card({ dueAt: { iso: new Date(NOW + 20 * DAY_MS).toISOString() } })

    expect(cardMatchesBoardFilter(noDate, filterWith({ dueDate: { noDates: true } }), context)).toBe(true)
    expect(cardMatchesBoardFilter(overdue, filterWith({ dueDate: { overdue: true } }), context)).toBe(true)
    expect(cardMatchesBoardFilter(
      card({ ...overdue, isCompleted: true }),
      filterWith({ dueDate: { overdue: true } }),
      context,
    )).toBe(false)
    expect(cardMatchesBoardFilter(tomorrow, filterWith({ dueDate: { dueInDay: true } }), context)).toBe(true)
    expect(cardMatchesBoardFilter(nextWeek, filterWith({ dueDate: { dueInDay: true } }), context)).toBe(false)
    expect(cardMatchesBoardFilter(nextWeek, filterWith({ dueDate: { dueInWeek: true } }), context)).toBe(true)
    expect(cardMatchesBoardFilter(nextMonth, filterWith({ dueDate: { dueInMonth: true } }), context)).toBe(true)
    expect(cardMatchesBoardFilter(nextMonth, filterWith({ dueDate: { dueInWeek: true } }), context)).toBe(false)
  })

  it('filters labels with any vs all match modes', () => {
    const feature = card({ labelId: 'feature' })
    const unlabeled = card({ labelId: '' })

    expect(cardMatchesBoardFilter(
      unlabeled,
      filterWith({ labels: { noLabels: true } }),
      context,
    )).toBe(true)

    const any = filterWith({
      matchMode: 'any',
      labels: { selectedLabelIds: ['feature', 'bug'] },
    })
    expect(cardMatchesBoardFilter(feature, any, context)).toBe(true)
    expect(cardMatchesBoardFilter(unlabeled, any, context)).toBe(false)

    const all = filterWith({
      matchMode: 'all',
      labels: { selectedLabelIds: ['feature', 'bug'] },
    })
    expect(cardMatchesBoardFilter(feature, all, context)).toBe(false)
  })

  it('filters activity using updatedAt, raw, or comments', () => {
    const recent = card({ updatedAt: { iso: new Date(NOW - 2 * DAY_MS).toISOString() } })
    const stale = card({
      updatedAt: { iso: new Date(NOW - 40 * DAY_MS).toISOString() },
    })
    const fromComment = card({
      comments: [{ createdAtIso: new Date(NOW - DAY_MS).toISOString() }],
    })
    const fromRaw = card({
      raw: { updatedAt: { iso: new Date(NOW - 3 * DAY_MS).toISOString() } },
    })
    const never = card({ comments: [] })

    expect(cardMatchesBoardFilter(
      recent,
      filterWith({ activity: { activeLastWeek: true } }),
      context,
    )).toBe(true)
    expect(cardMatchesBoardFilter(
      stale,
      filterWith({ activity: { activeLastWeek: true } }),
      context,
    )).toBe(false)
    expect(cardMatchesBoardFilter(
      fromComment,
      filterWith({ activity: { activeLastTwoWeeks: true } }),
      context,
    )).toBe(true)
    expect(cardMatchesBoardFilter(
      fromRaw,
      filterWith({ activity: { activeLastFourWeeks: true } }),
      context,
    )).toBe(true)
    expect(cardMatchesBoardFilter(
      never,
      filterWith({ activity: { noActivityLastFourWeeks: true } }),
      context,
    )).toBe(true)
    expect(cardMatchesBoardFilter(
      stale,
      filterWith({ activity: { noActivityLastFourWeeks: true } }),
      context,
    )).toBe(true)
  })

  it('requires every active section to match', () => {
    const mixed = card({
      title: 'Login',
      isCompleted: true,
      labelId: 'bug',
    })

    expect(cardMatchesBoardFilter(
      mixed,
      filterWith({
        keyword: 'login',
        status: { notCompleted: true },
        labels: { selectedLabelIds: ['bug'] },
      }),
      context,
    )).toBe(false)

    expect(cardMatchesBoardFilter(
      mixed,
      filterWith({
        keyword: 'login',
        status: { completed: true },
        labels: { selectedLabelIds: ['bug'] },
      }),
      context,
    )).toBe(true)
  })
})

describe('collectMatchingCardIds', () => {
  it('collects matching ids across columns', () => {
    const columns = [
      { id: 'col-1', cards: [card({ id: 'a', title: 'Bug no login' }), card({ id: 'b', title: 'Design' })] },
      { id: 'col-2', cards: [card({ id: 'c', title: 'Login social' })] },
    ]

    const ids = collectMatchingCardIds(columns, filterWith({ keyword: 'login' }), context)
    expect([...ids]).toEqual(['a', 'c'])
  })
})
