import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import KanbanColumn from './KanbanColumn.jsx'

const styles = new Proxy({}, { get: (_, key) => String(key) })

function Icon() {
  return <span aria-hidden="true" />
}

function buildColumnProps(props = {}) {
  const defaults = {
    col: {
      id: 'col-1',
      title: 'A fazer',
      color: '#4290da',
      cards: [],
    },
    dragState: null,
    dropTarget: null,
    draggedFile: null,
    fileDropTargetCardId: null,
    onDragStart: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
    onDragEnd: vi.fn(),
    onFileDragOver: vi.fn(),
    onFileDrop: vi.fn(),
    onAddCard: vi.fn(),
    onDeleteCol: vi.fn(),
    onRenameCol: vi.fn(),
    onChangeColColor: vi.fn(),
    onCardClick: vi.fn(),
    labels: [],
    members: [],
    colorOptions: [],
    icons: {
      Plus: Icon,
      More: Icon,
      Edit: Icon,
      Trash: Icon,
      X: Icon,
      Check: Icon,
      Comment: Icon,
      Clock: Icon,
      Calendar: Icon,
    },
    styles,
  }
  return { ...defaults, ...props }
}

function renderColumn(props = {}) {
  const mergedProps = buildColumnProps(props)

  render(<KanbanColumn {...mergedProps} />)

  return mergedProps
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
      expect(screen.queryByLabelText('Título do cartão')).toBeNull()
    })

    resolveCreation(true)
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

    const { rerender } = render(<KanbanColumn {...props} />)

    rerender(
      <KanbanColumn
        {...props}
        col={{
          ...props.col,
          title: 'Em progresso',
        }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /abrir cartão card memoizado/i }))

    expect(onCardClick).toHaveBeenCalledWith(card, 'Em progresso')
  })

  it('passes the calendar icon through to cards with due dates', () => {
    function DueIcon() {
      return <span data-testid="due-icon" />
    }

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
      icons: {
        ...buildColumnProps().icons,
        Calendar: DueIcon,
      },
    })

    expect(screen.getByTestId('due-icon')).toBeInTheDocument()
  })
})
