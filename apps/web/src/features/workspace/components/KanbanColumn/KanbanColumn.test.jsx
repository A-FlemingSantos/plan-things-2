import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import KanbanColumn from './KanbanColumn.jsx'

const styles = new Proxy({}, { get: (_, key) => String(key) })

function Icon() {
  return <span aria-hidden="true" />
}

function renderColumn(props = {}) {
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
      Comment: Icon,
      Clock: Icon,
    },
    styles,
  }
  const mergedProps = { ...defaults, ...props }

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
})
