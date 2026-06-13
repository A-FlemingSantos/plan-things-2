import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import KanbanCard from './KanbanCard.jsx'

const styles = new Proxy({}, { get: (_, key) => String(key) })

function buildCard(overrides = {}) {
  return {
    id: 'card-1',
    title: 'Card de teste',
    labelId: '',
    memberIds: [],
    comments: [],
    attachments: [],
    checklists: [],
    dueDate: '',
    ...overrides,
  }
}

function renderCard(props = {}) {
  const defaults = {
    card: buildCard(),
    colId: 'col-1',
    isDragging: false,
    isDropTarget: false,
    onDragStart: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
    onDragEnd: vi.fn(),
    onClick: vi.fn(),
    labels: [],
    members: [],
    styles,
  }
  const mergedProps = { ...defaults, ...props }

  render(<KanbanCard {...mergedProps} />)

  return {
    ...mergedProps,
    cardElement: screen.getByRole('button', { name: /abrir cartão card de teste/i }),
  }
}

function buildDataTransfer() {
  return {
    dropEffect: 'move',
    effectAllowed: 'move',
    getData: vi.fn(),
    setData: vi.fn(),
    types: [],
  }
}

describe('KanbanCard drag-and-drop', () => {
  it('keeps the existing card drag behavior when no file is being dragged', () => {
    const onDragStart = vi.fn()
    const onDragOver = vi.fn()
    const onDrop = vi.fn()
    const { cardElement } = renderCard({
      onDragStart,
      onDragOver,
      onDrop,
    })
    const dataTransfer = buildDataTransfer()

    fireEvent.dragStart(cardElement, { dataTransfer })
    fireEvent.dragOver(cardElement, { dataTransfer })
    fireEvent.drop(cardElement, { dataTransfer })

    expect(onDragStart).toHaveBeenCalledWith('card-1', 'col-1')
    expect(onDragOver).toHaveBeenCalledWith({ type: 'card', cardId: 'card-1', colId: 'col-1' })
    expect(onDrop).toHaveBeenCalledWith({ type: 'card', cardId: 'card-1', colId: 'col-1' })
  })

  it('renders attachment count and checklist progress metadata', () => {
    renderCard({
      card: buildCard({
        attachments: [
          { id: 'attachment-1', fileId: 'file-1', name: 'briefing.pdf' },
          { id: 'attachment-2', fileId: 'file-2', name: 'roadmap.pdf' },
        ],
        dueDate: 'Amanhã',
        checklists: [
          {
            id: 'checklist-1',
            title: 'Checklist',
            items: [
              { id: 'item-1', checked: true, text: 'Primeiro item' },
              { id: 'item-2', checked: false, text: 'Segundo item' },
            ],
          },
        ],
      }),
    })

    expect(screen.getByLabelText('2 anexos')).toBeInTheDocument()
    expect(screen.getByLabelText('Checklist 50% concluída')).toBeInTheDocument()
    expect(screen.getByLabelText('Entrega Amanhã')).toBeInTheDocument()
  })

  it('counts only user comments in the card metadata', () => {
    renderCard({
      card: buildCard({
        comments: [
          { id: 'comment-1', text: 'Comentario', kind: 'USER_COMMENT' },
          { id: 'activity-1', text: 'atribuiu a: Arthur', kind: 'ASSIGNEE_ACTIVITY' },
        ],
      }),
    })

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.queryByText('2')).not.toBeInTheDocument()
  })
})
