import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AddColumnComposer from './AddColumnComposer.jsx'

const styles = new Proxy({}, { get: (_, key) => String(key) })

const STATUS_OPTIONS = [
  { id: '', label: 'Sem status', icon: 'CircleOff', color: 'var(--text-3)' },
  { id: 'in_progress', label: 'Em Progresso', icon: 'Loader', color: '#e8b923' },
]

const COLOR_OPTIONS = [
  { id: 'none', label: 'Sem cor', value: '' },
  { id: 'blue', label: 'Azul', value: '#2363eb' },
]

function buildProps(overrides = {}) {
  return {
    addingCol: true,
    newColTitle: '',
    setNewColTitle: vi.fn(),
    newColColor: '',
    setNewColColor: vi.fn(),
    colorOptions: COLOR_OPTIONS,
    newColStatus: '',
    setNewColStatus: vi.fn(),
    statusOptions: STATUS_OPTIONS,
    defaultColumnStatus: '',
    setAddingCol: vi.fn(),
    addColumn: vi.fn(),
    errorMessage: null,
    styles,
    ...overrides,
  }
}

describe('AddColumnComposer regression', () => {
  it('does not crash when option arrays are temporarily undefined across remounts', () => {
    const props = buildProps({
      colorOptions: undefined,
      statusOptions: undefined,
      defaultColumnStatus: undefined,
    })

    const { rerender, unmount } = render(<AddColumnComposer {...props} />)

    rerender(<AddColumnComposer {...props} addingCol={false} />)
    rerender(<AddColumnComposer {...props} addingCol />)
    rerender(<AddColumnComposer {...buildProps()} />)
    rerender(<AddColumnComposer {...props} />)

    expect(screen.getByLabelText('Nome da lista')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cor da lista: Sem cor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Status' })).toBeInTheDocument()

    unmount()

    expect(() => render(<AddColumnComposer {...props} />)).not.toThrow()
  })

  it('keeps pickers operable with empty fallback options', () => {
    render(<AddColumnComposer {...buildProps({ colorOptions: undefined, statusOptions: undefined })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cor da lista: Sem cor' }))
    expect(screen.getByRole('listbox', { name: 'Cores da lista' })).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Status' }))
    expect(screen.getByRole('listbox', { name: 'Status da lista' })).toBeInTheDocument()
  })
})
