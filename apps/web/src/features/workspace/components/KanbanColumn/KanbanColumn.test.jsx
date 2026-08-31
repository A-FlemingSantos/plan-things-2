import { DndContext } from '@dnd-kit/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import KanbanColumn, {
  expandColumnDragOverlay,
  forgetColumnDragOverlayHeight,
} from './KanbanColumn.jsx'

const styles = new Proxy({}, { get: (_, key) => String(key) })

function buildColumnProps(props = {}) {
  const defaults = {
    col: {
      id: 'col-1',
      title: 'A fazer',
      color: '#4290da',
      cards: [],
    },
    onAddCard: vi.fn(),
    onDeleteCol: vi.fn(),
    onRenameCol: vi.fn(),
    onChangeColColor: vi.fn(),
    onChangeColStatus: vi.fn(),
    onToggleCompactView: vi.fn(),
    statusOptions: [
      { id: '', label: 'Sem status', icon: 'CircleOff', color: 'var(--text-3)' },
      { id: 'in_progress', label: 'Em Progresso', icon: 'Loader', color: '#e8b923' },
    ],
    onCardClick: vi.fn(),
    labels: [],
    members: [],
    colorOptions: [],
    styles,
  }
  return { ...defaults, ...props }
}

function renderColumn(props = {}) {
  const mergedProps = buildColumnProps(props)

  const view = render(
    <DndContext>
      <KanbanColumn {...mergedProps} />
    </DndContext>,
  )

  return { ...mergedProps, ...view }
}

describe('KanbanColumn card composer', () => {
  it('hides the composer immediately while the card creation request is pending', async () => {
    let resolveCreation
    const onAddCard = vi.fn(() => new Promise((resolve) => {
      resolveCreation = resolve
    }))

    renderColumn({ onAddCard })

    fireEvent.click(screen.getAllByRole('button', { name: /adicionar cartão/i }).at(-1))
    fireEvent.change(screen.getByLabelText('Título do cartão'), {
      target: { value: 'Novo cartão' },
    })
    fireEvent.keyDown(screen.getByLabelText('Título do cartão'), {
      key: 'Enter',
      shiftKey: false,
    })

    expect(onAddCard).toHaveBeenCalledWith('col-1', 'Novo cartão')
    await waitFor(() => {
      const input = screen.getByLabelText('Título do cartão')
      expect(input).toHaveAttribute('tabindex', '-1')
      expect(input.closest('[aria-hidden="true"]')).not.toBeNull()
    })

    resolveCreation(true)

    await waitFor(() => {
      const input = screen.getByLabelText('Título do cartão')
      expect(input).toHaveAttribute('tabindex', '0')
      expect(input).toHaveValue('')
      expect(input.closest('[aria-hidden="true"]')).toBeNull()
    })
  })

  it('opens cards with the latest column title after the column is renamed', () => {
    const card = {
      id: 'card-1',
      title: 'Card memoizado',
      labelId: '',
      memberIds: [],
      comments: [],
      attachments: [],
      checklists: [],
      dueDate: '',
    }
    const onCardClick = vi.fn()
    const props = buildColumnProps({
      col: {
        id: 'col-1',
        title: 'A fazer',
        color: '#4290da',
        cards: [card],
      },
      onCardClick,
    })

    const { rerender } = render(
      <DndContext>
        <KanbanColumn {...props} />
      </DndContext>,
    )

    rerender(
      <DndContext>
        <KanbanColumn
          {...props}
          col={{
            ...props.col,
            title: 'Em progresso',
          }}
        />
      </DndContext>,
    )
    fireEvent.click(screen.getByRole('button', { name: /abrir cartão card memoizado/i }))

    expect(onCardClick).toHaveBeenCalledWith(card, 'Em progresso')
  })

  it('closes the rename input immediately while the rename request is pending and reopens it on failure', async () => {
    let rejectRename
    const onRenameCol = vi.fn(() => new Promise((_, reject) => {
      rejectRename = reject
    }))

    renderColumn({ onRenameCol })

    fireEvent.click(screen.getByRole('button', { name: /opções da lista/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /renomear/i }))
    fireEvent.change(screen.getByLabelText('Nome da coluna'), {
      target: { value: 'Em andamento' },
    })
    fireEvent.keyDown(screen.getByLabelText('Nome da coluna'), { key: 'Enter' })

    await waitFor(() => {
      expect(screen.queryByLabelText('Nome da coluna')).toBeNull()
    })

    rejectRename(new Error('Falha ao renomear'))

    expect(await screen.findByLabelText('Nome da coluna')).toHaveValue('Em andamento')
    expect(screen.getByText('Falha ao renomear')).toBeInTheDocument()
  })

  it('shows the column status icon before the title when a status is defined', () => {
    const { container } = render(
      <DndContext>
        <KanbanColumn {...buildColumnProps({
          col: {
            id: 'col-1',
            title: 'Em andamento',
            color: '#4290da',
            status: 'in_progress',
            cards: [],
          },
        })} />
      </DndContext>,
    )

    expect(container.querySelector('.colStatusIcon')).toBeInTheDocument()
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
  })

  it('hides the column status icon when the status is empty', () => {
    const { container } = render(
      <DndContext>
        <KanbanColumn {...buildColumnProps({
          col: {
            id: 'col-1',
            title: 'Sem status',
            color: '#4290da',
            status: '',
            cards: [],
          },
        })} />
      </DndContext>,
    )

    expect(container.querySelector('.colStatusIcon')).toBeNull()
  })

  it('renders the controlled compact view and requests its restoration from the column menu', () => {
    const onToggleCompactView = vi.fn()
    renderColumn({ isCompact: true, onToggleCompactView })

    expect(document.querySelector('.columnCompact')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /adicionar cartão/i })).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /opções da lista/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Expandir lista' }))

    expect(onToggleCompactView).toHaveBeenCalledWith('col-1')
  })

  it('renders due date metadata on cards with due dates', () => {
    renderColumn({
      col: {
        id: 'col-1',
        title: 'A fazer',
        color: '#4290da',
        cards: [
          {
            id: 'card-1',
            title: 'Card com data',
            labelId: '',
            memberIds: [],
            comments: [],
            attachments: [],
            checklists: [],
            dueDate: 'Hoje',
          },
        ],
      },
    })

    expect(screen.getByLabelText('Entrega Hoje')).toBeInTheDocument()
  })
})

describe('KanbanColumn drag overlay', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    forgetColumnDragOverlayHeight('col-1')
  })
  function emptyRect() {
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON() {},
    }
  }

  it('collapses a tall overlay down to the drag max height', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect() {
      if (this.getAttribute?.('data-column-id') === 'col-1') {
        return {
          ...emptyRect(),
          width: 300,
          height: 800,
          right: 300,
          bottom: 800,
        }
      }

      return emptyRect()
    })

    render(
      <KanbanColumn
        {...buildColumnProps({
          isDragOverlay: true,
          col: {
            id: 'col-1',
            title: 'A fazer',
            color: '#4290da',
            cards: Array.from({ length: 12 }, (_, index) => ({
              id: `card-${index}`,
              title: `Card ${index + 1}`,
              labelId: '',
              memberIds: [],
              comments: [],
              attachments: [],
              checklists: [],
              dueDate: '',
            })),
          },
        })}
      />,
    )

    const column = document.querySelector('[data-column-id="col-1"]')
    expect(column).not.toBeNull()

    await waitFor(() => {
      expect(column.style.maxHeight).toBe('320px')
      expect(column.className).toContain('columnDragOverlayCollapsed')
    })
  })

  it('keeps short overlays at their natural height', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect() {
      if (this.getAttribute?.('data-column-id') === 'col-1') {
        return {
          ...emptyRect(),
          width: 300,
          height: 180,
          right: 300,
          bottom: 180,
        }
      }

      return emptyRect()
    })

    render(
      <KanbanColumn
        {...buildColumnProps({
          isDragOverlay: true,
          col: {
            id: 'col-1',
            title: 'A fazer',
            color: '#4290da',
            cards: [
              {
                id: 'card-1',
                title: 'Um cartão',
                labelId: '',
                memberIds: [],
                comments: [],
                attachments: [],
                checklists: [],
                dueDate: '',
              },
            ],
          },
        })}
      />,
    )

    const column = document.querySelector('[data-column-id="col-1"]')
    expect(column.style.maxHeight).toBe('')
    expect(column.className).not.toContain('columnDragOverlayCollapsed')
  })

  it('expands a collapsed overlay back to its resting height', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect() {
      if (this.getAttribute?.('data-column-id') === 'col-1') {
        return {
          ...emptyRect(),
          width: 300,
          height: 800,
          right: 300,
          bottom: 800,
        }
      }

      return emptyRect()
    })

    render(
      <KanbanColumn
        {...buildColumnProps({
          isDragOverlay: true,
          col: {
            id: 'col-1',
            title: 'A fazer',
            color: '#4290da',
            cards: Array.from({ length: 12 }, (_, index) => ({
              id: `card-${index}`,
              title: `Card ${index + 1}`,
              labelId: '',
              memberIds: [],
              comments: [],
              attachments: [],
              checklists: [],
              dueDate: '',
            })),
          },
        })}
      />,
    )

    const column = document.querySelector('[data-column-id="col-1"]')
    await waitFor(() => {
      expect(column.style.maxHeight).toBe('320px')
    })

    expandColumnDragOverlay(column)
    expect(column.style.maxHeight).toBe('800px')
    expect(column.dataset.kanbanDragExpanding).toBe('true')
  })

  it('expands back to the on-board height instead of the full card stack', async () => {
    const source = document.createElement('div')
    source.setAttribute('data-column-id', 'col-1')
    document.body.appendChild(source)

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect() {
      if (this === source) {
        return {
          ...emptyRect(),
          width: 300,
          height: 520,
          right: 300,
          bottom: 520,
        }
      }

      if (this.getAttribute?.('data-column-id') === 'col-1') {
        return {
          ...emptyRect(),
          width: 300,
          height: 1200,
          right: 300,
          bottom: 1200,
        }
      }

      return emptyRect()
    })

    try {
      render(
        <KanbanColumn
          {...buildColumnProps({
            isDragOverlay: true,
            col: {
              id: 'col-1',
              title: 'A fazer',
              color: '#4290da',
              cards: Array.from({ length: 12 }, (_, index) => ({
                id: `card-${index}`,
                title: `Card ${index + 1}`,
                labelId: '',
                memberIds: [],
                comments: [],
                attachments: [],
                checklists: [],
                dueDate: '',
              })),
            },
          })}
        />,
      )

      const column = document.querySelector('[class*="columnDragOverlay"]')

      await waitFor(() => {
        expect(column.style.maxHeight).toBe('320px')
      })

      expandColumnDragOverlay(column)
      expect(column.style.maxHeight).toBe('520px')
    } finally {
      source.remove()
    }
  })
})

describe('KanbanColumn card groups', () => {
  const cards = [
    {
      id: 'card-1',
      title: 'Primeiro',
      labelId: '',
      memberIds: [],
      comments: [],
      attachments: [],
      checklists: [],
      dueDate: '',
    },
    {
      id: 'card-2',
      title: 'Segundo',
      labelId: '',
      memberIds: [],
      comments: [],
      attachments: [],
      checklists: [],
      dueDate: '',
    },
    {
      id: 'card-3',
      title: 'Terceiro',
      labelId: '',
      memberIds: [],
      comments: [],
      attachments: [],
      checklists: [],
      dueDate: '',
    },
  ]

  it('creates a group from the insert control between two cards', async () => {
    const onCreateColumnGroup = vi.fn(async (_columnId, startCardId) => ({
      id: 'group-1',
      title: '',
      startCardId,
      collapsed: false,
    }))

    renderColumn({
      col: {
        id: 'col-1',
        title: 'A fazer',
        color: '#4290da',
        cards,
        groups: [],
      },
      onCreateColumnGroup,
    })

    fireEvent.click(screen.getAllByRole('button', { name: /criar agrupamento com os cartões abaixo/i })[0])

    await waitFor(() => {
      expect(onCreateColumnGroup).toHaveBeenCalledWith('col-1', 'card-2')
    })

    const insert = screen.getAllByRole('button', { name: /criar agrupamento com os cartões abaixo/i })[0]
    expect(insert.closest('[aria-label^="Abrir cartão"]')).toBeNull()
  })

  it('animates a newly created group wrapping its cards', () => {
    const view = renderColumn({
      col: {
        id: 'col-1',
        title: 'A fazer',
        color: '#4290da',
        cards,
        groups: [],
      },
    })

    view.rerender(
      <DndContext>
        <KanbanColumn
          {...buildColumnProps({
            col: {
              id: 'col-1',
              title: 'A fazer',
              color: '#4290da',
              cards,
              groups: [
                { id: 'group-1', title: 'Sprint', startCardId: 'card-2', collapsed: false },
              ],
            },
          })}
        />
      </DndContext>,
    )

    expect(screen.getByRole('region', { name: 'Sprint' }).className).toContain('columnGroupEnter')
  })

  it('does not animate groups that were already on the board', () => {
    renderColumn({
      col: {
        id: 'col-1',
        title: 'A fazer',
        color: '#4290da',
        cards,
        groups: [
          { id: 'group-1', title: 'Sprint', startCardId: 'card-2', collapsed: false },
        ],
      },
    })

    expect(screen.getByRole('region', { name: 'Sprint' }).className).not.toContain('columnGroupEnter')
  })

  it('does not offer a group insert between cards already inside a group', () => {
    renderColumn({
      col: {
        id: 'col-1',
        title: 'A fazer',
        color: '#4290da',
        cards,
        groups: [
          { id: 'group-1', title: 'Sprint', startCardId: 'card-2', collapsed: false },
        ],
      },
    })

    expect(screen.queryAllByRole('button', { name: /criar agrupamento com os cartões abaixo/i })).toHaveLength(0)
  })

  it('wraps cards below a group and collapses them from the header chevron', () => {
    const onUpdateColumnGroup = vi.fn()

    renderColumn({
      col: {
        id: 'col-1',
        title: 'A fazer',
        color: '#4290da',
        cards,
        groups: [
          { id: 'group-1', title: 'Sprint', startCardId: 'card-2', collapsed: false },
        ],
      },
      onUpdateColumnGroup,
    })

    expect(screen.getByRole('button', { name: /abrir cartão segundo/i })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /recolher sprint/i }))
    expect(onUpdateColumnGroup).toHaveBeenCalledWith('col-1', 'group-1', expect.any(Function))
    expect(onUpdateColumnGroup.mock.calls[0][2]({ collapsed: false })).toEqual({ collapsed: true })
  })

  it('keeps collapsed group cards out of the accessibility tree', () => {
    renderColumn({
      col: {
        id: 'col-1',
        title: 'A fazer',
        color: '#4290da',
        cards,
        groups: [
          { id: 'group-1', title: 'Sprint', startCardId: 'card-2', collapsed: true },
        ],
      },
    })

    expect(screen.getByRole('button', { name: /abrir cartão primeiro/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /abrir cartão segundo/i })).toBeNull()
    expect(screen.getByRole('button', { name: /expandir sprint/i })).toBeTruthy()
  })

  it('removes a group from the header without deleting cards', () => {
    const onDeleteColumnGroup = vi.fn()

    renderColumn({
      col: {
        id: 'col-1',
        title: 'A fazer',
        color: '#4290da',
        cards,
        groups: [
          { id: 'group-1', title: 'Sprint', startCardId: 'card-2', collapsed: false },
        ],
      },
      onDeleteColumnGroup,
    })

    fireEvent.click(screen.getByRole('button', { name: /remover sprint/i }))
    expect(onDeleteColumnGroup).toHaveBeenCalledWith('col-1', 'group-1')
    expect(screen.getByRole('button', { name: /abrir cartão segundo/i })).toBeTruthy()
  })
})

