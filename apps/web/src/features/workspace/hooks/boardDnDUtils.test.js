import { describe, expect, it } from 'vitest'
import {
  applyCardDropToColumns,
  applyDragOverToColumns,
  columnGroupBeforeDropId,
  findCardIndex,
  findColumnIdForItem,
  moveCardInColumns,
  moveCardToIndex,
  reorderCardWithinColumn,
  reorderColumnsByDrag,
  resolveOverIndex,
} from './boardDnDUtils.js'

function buildColumns() {
  return [
    {
      id: 'col-1',
      title: 'Backlog',
      cards: [
        { id: 'card-1', title: 'Card 1', columnId: 'col-1' },
        { id: 'card-2', title: 'Card 2', columnId: 'col-1' },
        { id: 'card-3', title: 'Card 3', columnId: 'col-1' },
      ],
    },
    {
      id: 'col-2',
      title: 'Doing',
      cards: [
        { id: 'card-4', title: 'Card 4', columnId: 'col-2' },
      ],
    },
  ]
}

describe('boardDnDUtils', () => {
  it('finds the column that contains a card', () => {
    const columns = buildColumns()
    expect(findColumnIdForItem(columns, 'card-2')).toBe('col-1')
    expect(findColumnIdForItem(columns, 'col-2')).toBe('col-2')
  })

  it('resolves the group boundary to its first member position', () => {
    const columns = [{
      ...buildColumns()[0],
      groups: [{
        id: 'group-1',
        startCardId: 'card-2',
        cardIds: ['card-2', 'card-3'],
      }],
    }, buildColumns()[1]]
    const boundaryId = columnGroupBeforeDropId('col-1', 'group-1')

    expect(findColumnIdForItem(columns, boundaryId)).toBe('col-1')
    expect(resolveOverIndex(columns, ['col-1', 'col-2'], boundaryId, 'col-1')).toBe(1)
  })

  it('projects a grouped drop atomically with its final membership and order', () => {
    const columns = [{
      ...buildColumns()[0],
      groups: [{
        id: 'group-1',
        startCardId: 'card-2',
        endCardId: 'card-3',
        cardIds: ['card-2', 'card-3'],
      }],
    }, buildColumns()[1]]

    const reordered = applyCardDropToColumns(
      columns,
      'card-3',
      'col-1',
      'col-1',
      1,
      'group-1',
    )
    const detached = applyCardDropToColumns(
      columns,
      'card-2',
      'col-1',
      'col-1',
      1,
      null,
    )

    expect(reordered[0].cards.map((card) => card.id)).toEqual(['card-1', 'card-3', 'card-2'])
    expect(reordered[0].groups[0].cardIds).toEqual(['card-3', 'card-2'])
    expect(detached[0].groups[0].cardIds).toEqual(['card-3'])
  })

  it('moves a card to an explicit index in another column', () => {
    const columns = buildColumns()
    const nextColumns = moveCardToIndex(columns, 'card-1', 'col-1', 'col-2', 0)

    expect(nextColumns[0].cards.map((card) => card.id)).toEqual(['card-2', 'card-3'])
    expect(nextColumns[1].cards.map((card) => card.id)).toEqual(['card-1', 'card-4'])
    expect(nextColumns[1].cards[0].columnId).toBe('col-2')
  })

  it('reorders cards within the same column', () => {
    const columns = buildColumns()
    const nextColumns = reorderCardWithinColumn(columns, 'col-1', 0, 2)

    expect(nextColumns[0].cards.map((card) => card.id)).toEqual(['card-2', 'card-3', 'card-1'])
  })

  it('keeps legacy moveCardInColumns card targets working', () => {
    const columns = buildColumns()
    const nextColumns = moveCardInColumns(columns, 'card-3', 'col-1', {
      type: 'card',
      cardId: 'card-1',
      colId: 'col-1',
    })

    expect(nextColumns[0].cards.map((card) => card.id)).toEqual(['card-3', 'card-1', 'card-2'])
  })

  it('keeps legacy moveCardInColumns column targets appending to the end', () => {
    const columns = buildColumns()
    const nextColumns = moveCardInColumns(columns, 'card-1', 'col-1', {
      type: 'col',
      colId: 'col-2',
    })

    expect(nextColumns[1].cards.map((card) => card.id)).toEqual(['card-4', 'card-1'])
    expect(findCardIndex(nextColumns, 'col-2', 'card-1')).toBe(1)
  })

  it('removes duplicate card instances before inserting in another column', () => {
    const columns = buildColumns()
    const duplicatedColumns = columns.map((column) => {
      if (column.id !== 'col-2') {
        return column
      }

      return {
        ...column,
        cards: [
          ...column.cards,
          { id: 'card-1', title: 'Card 1 duplicate', columnId: 'col-2' },
        ],
      }
    })

    const nextColumns = moveCardToIndex(duplicatedColumns, 'card-1', 'col-1', 'col-2', 0)

    expect(nextColumns.flatMap((column) => column.cards).filter((card) => card.id === 'card-1')).toHaveLength(1)
    expect(nextColumns[1].cards.map((card) => card.id)).toEqual(['card-1', 'card-4'])
  })

  it('applies drag-over updates from the current drag snapshot', () => {
    const columns = buildColumns()
    const firstPass = applyDragOverToColumns(columns, ['col-1', 'col-2'], 'card-1', 'col-2')
    const secondPass = applyDragOverToColumns(firstPass.columns, ['col-1', 'col-2'], 'card-1', 'card-4')

    expect(firstPass.changed).toBe(true)
    expect(secondPass.changed).toBe(true)
    expect(secondPass.columns[1].cards.map((card) => card.id)).toEqual(['card-1', 'card-4'])
    expect(secondPass.overColumnId).toBe('col-2')
  })

  it('skips drag-over updates when active and over target are the same card', () => {
    const columns = buildColumns()
    const result = applyDragOverToColumns(columns, ['col-1', 'col-2'], 'card-2', 'card-2')

    expect(result.changed).toBe(false)
    expect(result.overColumnId).toBeNull()
    expect(result.columns).toBe(columns)
  })

  it('reports the destination column during drag-over', () => {
    const columns = buildColumns()
    const result = applyDragOverToColumns(columns, ['col-1', 'col-2'], 'card-1', 'card-4')

    expect(result.overColumnId).toBe('col-2')
  })

  it('reorders columns by drag target', () => {
    const columns = buildColumns()
    const result = reorderColumnsByDrag(columns, 'col-1', 'col-2')

    expect(result.changed).toBe(true)
    expect(result.columns.map((column) => column.id)).toEqual(['col-2', 'col-1'])
  })

  it('moves a column to the first position', () => {
    const columns = [
      ...buildColumns(),
      { id: 'col-3', title: 'To Do', cards: [] },
    ]
    const result = reorderColumnsByDrag(columns, 'col-3', 'col-1')

    expect(result.changed).toBe(true)
    expect(result.columns.map((column) => column.id)).toEqual(['col-3', 'col-1', 'col-2'])
  })
})
