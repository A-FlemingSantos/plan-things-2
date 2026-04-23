import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import KanbanCard from './KanbanCard.jsx'

const styles = new Proxy({}, { get: (_, key) => String(key) })

function Icon() {
  return <span aria-hidden="true" />
}

function buildCard(overrides = {}) {
  return {
    id: 'card-1',
    title: 'Card de teste',
    labelId: '',
    memberIds: [],
    comments: [],
    attachments: [],
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
    draggedFile: null,
    isFileDropTarget: false,
    isFileDropDisabled: false,
    onDragStart: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
    onDragEnd: vi.fn(),
    onFileDragOver: vi.fn(),
    onFileDrop: vi.fn(),
    onClick: vi.fn(),
    labels: [],
    members: [],
    CommentIcon: Icon,
    ClockIcon: Icon,
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
    types: ['application/x-planthings-file'],
  }
}

describe('KanbanCard file drag-and-drop', () => {
  it('accepts an eligible dragged file and calls the file drop handler', () => {
    const draggedFile = { id: 'file-1', name: 'briefing.pdf' }
    const onFileDrop = vi.fn()
    const onDrop = vi.fn()
    const onFileDragOver = vi.fn()
    const { cardElement } = renderCard({
      draggedFile,
      isFileDropTarget: true,
      onFileDrop,
      onDrop,
      onFileDragOver,
    })
    const dataTransfer = buildDataTransfer()

    fireEvent.dragOver(cardElement, { dataTransfer })
    fireEvent.drop(cardElement, { dataTransfer })

    expect(onFileDragOver).toHaveBeenCalledWith('card-1')
    expect(onFileDrop).toHaveBeenCalledWith(draggedFile, 'card-1')
    expect(onDrop).not.toHaveBeenCalled()
    expect(dataTransfer.dropEffect).toBe('copy')
  })

  it('blocks file drops when the dragged file is already attached', () => {
    const draggedFile = { id: 'file-1', name: 'briefing.pdf' }
    const onFileDrop = vi.fn()
    const onFileDragOver = vi.fn()
    const { cardElement } = renderCard({
      card: buildCard({
        attachments: [{ id: 'attachment-1', fileId: 'file-1', name: 'briefing.pdf' }],
      }),
      draggedFile,
      isFileDropDisabled: true,
      onFileDrop,
      onFileDragOver,
    })
    const dataTransfer = buildDataTransfer()

    fireEvent.dragOver(cardElement, { dataTransfer })
    fireEvent.drop(cardElement, { dataTransfer })

    expect(cardElement).toHaveClass('cardFileDropDisabled')
    expect(onFileDragOver).toHaveBeenCalledWith(null)
    expect(onFileDrop).not.toHaveBeenCalled()
    expect(dataTransfer.dropEffect).toBe('none')
  })

  it('keeps the existing card drag behavior when no file is being dragged', () => {
    const onDragStart = vi.fn()
    const onDragOver = vi.fn()
    const onDrop = vi.fn()
    const onFileDrop = vi.fn()
    const { cardElement } = renderCard({
      onDragStart,
      onDragOver,
      onDrop,
      onFileDrop,
    })
    const dataTransfer = buildDataTransfer()

    fireEvent.dragStart(cardElement, { dataTransfer })
    fireEvent.dragOver(cardElement, { dataTransfer })
    fireEvent.drop(cardElement, { dataTransfer })

    expect(onDragStart).toHaveBeenCalledWith('card-1', 'col-1')
    expect(onDragOver).toHaveBeenCalledWith({ type: 'card', cardId: 'card-1', colId: 'col-1' })
    expect(onDrop).toHaveBeenCalledWith({ type: 'card', cardId: 'card-1', colId: 'col-1' })
    expect(onFileDrop).not.toHaveBeenCalled()
  })
})
