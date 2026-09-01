import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ColMenu from './ColMenu.jsx'

const styles = new Proxy({}, { get: (_, key) => String(key) })

const colorOptions = [
  { value: '', label: 'Sem cor' },
  { value: '#ff0000', label: 'Vermelho' },
]

const statusOptions = [
  { id: '', label: 'Sem status', icon: 'CircleOff', color: 'var(--text-3)' },
  { id: 'progress', label: 'Em progresso', icon: 'Loader', color: '#2abb7f' },
]

describe('ColMenu', () => {
  it('renders list options with popover layout', () => {
    const anchor = { current: document.createElement('button') }

    render(
      <ColMenu
        anchorRef={anchor}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onChangeColor={vi.fn()}
        onChangeStatus={vi.fn()}
        onToggleCompactView={vi.fn()}
        onClose={vi.fn()}
        colorOptions={colorOptions}
        statusOptions={statusOptions}
        styles={styles}
      />,
    )

    expect(screen.getByRole('menu', { name: 'Opções da lista' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Renomear/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Visualização compacta/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Excluir lista/i })).toBeInTheDocument()
  })

  it('opens the status flyout submenu', async () => {
    const user = userEvent.setup()
    const anchor = { current: document.createElement('button') }

    render(
      <ColMenu
        anchorRef={anchor}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onChangeColor={vi.fn()}
        onChangeStatus={vi.fn()}
        onToggleCompactView={vi.fn()}
        onClose={vi.fn()}
        colorOptions={colorOptions}
        statusOptions={statusOptions}
        styles={styles}
      />,
    )

    await user.click(screen.getByRole('menuitem', { name: /Status/i }))

    expect(screen.getByRole('menu', { name: 'Status da lista' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: 'Em progresso' })).toBeInTheDocument()
  })
})
