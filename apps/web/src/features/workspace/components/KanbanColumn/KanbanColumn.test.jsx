import { DndContext } from '@dnd-kit/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import KanbanColumn from './KanbanColumn.jsx'

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

  render(
    <DndContext>
      <KanbanColumn {...mergedProps} />
    </DndContext>,
  )

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
