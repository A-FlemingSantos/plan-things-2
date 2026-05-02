import { describe, expect, it, vi } from 'vitest'
import { apiRequest } from '@plan-things/shared-client/api'
import { mapBoardCard } from '@plan-things/shared-client/board'
import { getFileSizeBytes, getFileTimestamp } from '@plan-things/shared-client/files'

describe('mobile/backend shared adapters', () => {
  it('normalizes backend checklist title/completed fields for the mobile UI', () => {
    const card = mapBoardCard({
      id: 'card-1',
      columnId: 'col-1',
      title: 'Preparar release',
      label: null,
      assignees: [],
      comments: [],
      attachments: [],
      checklists: [
        {
          id: 'checklist-1',
          title: 'Deploy',
          items: [
            {
              id: 'item-1',
              title: 'Rodar testes',
              completed: true,
            },
          ],
        },
      ],
    })

    expect(card.checklists[0].items[0]).toMatchObject({
      title: 'Rodar testes',
      text: 'Rodar testes',
      completed: true,
      checked: true,
    })
  })

  it('sorts files by numeric size instead of formatted labels', () => {
    const files = [
      { id: 'small', size: 900, sizeLabel: '900 B' },
      { id: 'large', size: 12000, sizeLabel: '12 KB' },
      { id: 'medium', size: 2048, sizeLabel: '2 KB' },
    ]

    const sorted = [...files].sort((a, b) => getFileSizeBytes(a) - getFileSizeBytes(b))

    expect(sorted.map((file) => file.id)).toEqual(['small', 'medium', 'large'])
  })

  it('orders recent files by modifiedAtIso with createdAtIso fallback', () => {
    const files = [
      { id: 'created-only', createdAtIso: '2026-05-01T10:00:00Z' },
      { id: 'older', modifiedAtIso: '2026-04-30T10:00:00Z', createdAtIso: '2026-04-29T10:00:00Z' },
      { id: 'newer', modifiedAtIso: '2026-05-02T10:00:00Z' },
    ]

    const sorted = [...files].sort((a, b) => getFileTimestamp(b) - getFileTimestamp(a))

    expect(sorted.map((file) => file.id)).toEqual(['newer', 'created-only', 'older'])
  })

  it('passes relative=false through apiRequest URL building', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { ok: true } }),
    }))

    await apiRequest('/api/ping', {
      origin: 'http://mobile-preview.local',
      relative: false,
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledWith('http://mobile-preview.local/api/ping', expect.any(Object))
  })
})
