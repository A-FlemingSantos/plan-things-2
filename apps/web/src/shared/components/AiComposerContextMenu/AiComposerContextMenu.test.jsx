import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { COMPOSER_CHIP_KIND_CARD } from '../ComposerChip/composerChipPresentation.jsx'
import AiComposerContextMenu from './AiComposerContextMenu.jsx'

const ChipIcon = () => null

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const normalized = value.length === 3
    ? value.split('').map((char) => `${char}${char}`).join('')
    : value
  const intValue = Number.parseInt(normalized, 16)
  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  }
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const srgb = [r, g, b].map((channel) => channel / 255)
  const linear = srgb.map((value) => (
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  ))
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2])
}

function contrastRatio(foregroundHex, backgroundHex) {
  const lumForeground = relativeLuminance(foregroundHex)
  const lumBackground = relativeLuminance(backgroundHex)
  const lighter = Math.max(lumForeground, lumBackground)
  const darker = Math.min(lumForeground, lumBackground)
  return (lighter + 0.05) / (darker + 0.05)
}

function createGithubChip(overrides = {}) {
  return {
    id: 'ctx-github',
    type: 'github',
    label: 'GitHub',
    kind: 'connector',
    ChipIcon,
    ...overrides,
  }
}

function createFileChip(overrides = {}) {
  return {
    id: 'ctx-file-rf2',
    type: 'file-rf2',
    label: 'requisitos.pdf',
    kind: 'file',
    isImage: false,
    ...overrides,
  }
}

describe('AiComposerContextMenu', () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => 'blob:preview')
    window.URL.revokeObjectURL = vi.fn()
  })
  it('syncs externally provided chips without echoing the update back to the parent', () => {
    const handleChipsChange = vi.fn()
    const { rerender } = render(
      <AiComposerContextMenu onChipsChange={handleChipsChange} initialChips={[]} />,
    )

    rerender(
      <AiComposerContextMenu
        onChipsChange={handleChipsChange}
        initialChips={[createGithubChip()]}
      />,
    )

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(handleChipsChange).not.toHaveBeenCalled()
  })

  it('does not reset local state for equivalent initial chips with a new array reference', () => {
    const handleChipsChange = vi.fn()
    const { rerender } = render(
      <AiComposerContextMenu
        onChipsChange={handleChipsChange}
        initialChips={[createGithubChip()]}
      />,
    )

    rerender(
      <AiComposerContextMenu
        onChipsChange={handleChipsChange}
        initialChips={[createGithubChip()]}
      />,
    )

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(handleChipsChange).not.toHaveBeenCalled()
  })

  it('renders the multicolor Slack logo in the connectors submenu', async () => {
    const user = userEvent.setup()
    render(<AiComposerContextMenu onChipsChange={vi.fn()} initialChips={[]} />)

    await user.click(screen.getByRole('button', { name: 'Adicionar contexto ao chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Conectores/i }))

    const slackRow = screen.getByRole('menuitem', { name: 'Slack' })
    const slackPaths = slackRow.querySelectorAll('svg path')
    expect(slackPaths).toHaveLength(4)
    expect(new Set([...slackPaths].map((path) => path.getAttribute('fill')))).toEqual(
      new Set(['#E01E5A', '#36C5F0', '#2EB67D', '#ECB22E']),
    )
  })

  it('notifies the parent once when a connector is toggled by the user', async () => {
    const user = userEvent.setup()
    const handleChipsChange = vi.fn()
    render(<AiComposerContextMenu onChipsChange={handleChipsChange} initialChips={[]} />)

    await user.click(screen.getByRole('button', { name: 'Adicionar contexto ao chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Conectores/i }))
    await user.click(screen.getByRole('menuitem', { name: 'GitHub' }))

    expect(handleChipsChange).toHaveBeenCalledTimes(1)
    expect(handleChipsChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'ctx-github',
        type: 'github',
        label: 'GitHub',
        kind: 'connector',
      }),
    ])
  })

  it('shows Planos in the default workspace menu', async () => {
    const user = userEvent.setup()
    render(<AiComposerContextMenu onChipsChange={vi.fn()} initialChips={[]} />)

    await user.click(screen.getByRole('button', { name: 'Adicionar contexto ao chat' }))

    expect(screen.getByRole('menuitem', { name: /Planos/i })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Cartão/i })).not.toBeInTheDocument()
  })

  it('shows Cartão instead of Planos when boardCards is provided', async () => {
    const user = userEvent.setup()
    render(
      <AiComposerContextMenu
        onChipsChange={vi.fn()}
        initialChips={[]}
        boardCards={[
          { id: 'card-1', title: 'Login UI', columnTitle: 'Em progresso' },
          { id: 'card-2', title: 'API auth', columnTitle: 'Backlog' },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Adicionar contexto ao chat' }))

    expect(screen.getByRole('menuitem', { name: /Cartão/i })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /^Planos$/i })).not.toBeInTheDocument()
  })

  it('adds a card context chip from the Kanban board menu', async () => {
    const user = userEvent.setup()
    const handleChipsChange = vi.fn()

    render(
      <AiComposerContextMenu
        onChipsChange={handleChipsChange}
        initialChips={[]}
        boardCards={[{ id: 'card-1', title: 'Login UI', columnTitle: 'Em progresso' }]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Adicionar contexto ao chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Cartão/i }))
    await user.click(screen.getByRole('menuitem', { name: /Login UI/i }))

    expect(handleChipsChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'ctx-card-card-1',
        type: 'card-card-1',
        label: 'Login UI',
        kind: COMPOSER_CHIP_KIND_CARD,
      }),
    ])
  })

  it('renders the Kanban card submenu in a floating layer above clipping containers', async () => {
    const user = userEvent.setup()
    render(
      <AiComposerContextMenu
        onChipsChange={vi.fn()}
        initialChips={[]}
        boardCards={[{ id: 'card-1', title: 'Login UI', columnTitle: 'Em progresso' }]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Adicionar contexto ao chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Cartão/i }))

    const cardsMenu = screen.getByRole('menu', { name: 'Cartões do plano' })
    expect(cardsMenu.className).toMatch(/submenuFloating/)
    expect(cardsMenu.parentElement?.parentElement).toBe(document.body)
  })

  it('preserves dark theme scope when rendering floating cards submenu in portal', async () => {
    const user = userEvent.setup()
    render(
      <div data-theme="dark">
        <AiComposerContextMenu
          onChipsChange={vi.fn()}
          initialChips={[]}
          boardCards={[{ id: 'card-1', title: 'Login UI', columnTitle: 'Em progresso' }]}
        />
      </div>,
    )

    await user.click(screen.getByRole('button', { name: 'Adicionar contexto ao chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Cartão/i }))

    const cardsMenu = screen.getByRole('menu', { name: 'Cartões do plano' })
    expect(cardsMenu.closest('[data-theme="dark"]')).toBeInTheDocument()
  })

  it('stops mousedown and pointerdown propagation inside floating cards submenu', async () => {
    const user = userEvent.setup()
    const documentMouseDownSpy = vi.fn()
    const documentPointerDownSpy = vi.fn()

    document.addEventListener('mousedown', documentMouseDownSpy)
    document.addEventListener('pointerdown', documentPointerDownSpy)

    render(
      <AiComposerContextMenu
        onChipsChange={vi.fn()}
        initialChips={[]}
        boardCards={[{ id: 'card-1', title: 'Login UI', columnTitle: 'Em progresso' }]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Adicionar contexto ao chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Cartão/i }))
    documentMouseDownSpy.mockClear()
    documentPointerDownSpy.mockClear()

    await user.click(screen.getByRole('menuitem', { name: /Login UI/i }))

    expect(documentMouseDownSpy).not.toHaveBeenCalled()
    expect(documentPointerDownSpy).not.toHaveBeenCalled()

    document.removeEventListener('mousedown', documentMouseDownSpy)
    document.removeEventListener('pointerdown', documentPointerDownSpy)
  })

  it('renders card chips with data-kind card and the card icon', () => {
    const { container } = render(
      <AiComposerContextMenu
        onChipsChange={vi.fn()}
        initialChips={[
          {
            id: 'ctx-card-card-1',
            type: 'card-card-1',
            label: 'Login UI',
            kind: COMPOSER_CHIP_KIND_CARD,
          },
        ]}
      />,
    )

    const chip = screen.getByText('Login UI').closest('[data-kind]')
    expect(chip).toHaveAttribute('data-kind', 'card')
    expect(chip.querySelector('svg rect')).toBeInTheDocument()
    expect(container.querySelector('[data-theme]')).toBeNull()
  })

  it('applies card chip dark-theme tokens when rendered inside a dark scope', () => {
    render(
      <div data-theme="dark">
        <AiComposerContextMenu
          onChipsChange={vi.fn()}
          initialChips={[
            {
              id: 'ctx-card-card-1',
              type: 'card-card-1',
              label: 'Login UI',
              kind: COMPOSER_CHIP_KIND_CARD,
            },
          ]}
        />
      </div>,
    )

    const chip = screen.getByText('Login UI').closest('[data-kind="card"]')
    expect(chip).toBeInTheDocument()
    expect(chip?.className).toMatch(/chip/)
  })

  it('keeps dark card chip palette above WCAG AA contrast for normal text', () => {
    const cssPath = join(process.cwd(), 'src/shared/components/AiComposerContextMenu/AiComposerContextMenu.module.css')
    const cssText = readFileSync(cssPath, 'utf8')

    expect(cssText).toContain('--composer-card-chip-bg: #1f253f;')
    expect(cssText).toContain('--composer-card-chip-text: #e5eaff;')

    const ratio = contrastRatio('#e5eaff', '#1f253f')
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('does not render file attachments as inline chips', () => {
    render(
      <AiComposerContextMenu
        onChipsChange={vi.fn()}
        initialChips={[createFileChip(), createGithubChip()]}
      />,
    )

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.queryByText('requisitos.pdf')).not.toBeInTheDocument()
  })

  it('adds uploaded files as attachment chips up to the limit', async () => {
    const user = userEvent.setup()
    const handleChipsChange = vi.fn()

    render(<AiComposerContextMenu onChipsChange={handleChipsChange} initialChips={[]} />)

    const input = document.querySelector('input[type="file"]')
    const file = new File(['hello'], 'notes.md', { type: 'text/markdown' })

    await user.upload(input, file)

    await waitFor(() => {
      expect(handleChipsChange).toHaveBeenCalled()
    })

    const lastCall = handleChipsChange.mock.calls.at(-1)?.[0]
    expect(lastCall).toEqual([
      expect.objectContaining({
        kind: 'file',
        label: 'notes.md',
        isImage: false,
      }),
    ])
  })

  it('adds mock recent files as attachment chips', async () => {
    const user = userEvent.setup()
    const handleChipsChange = vi.fn()

    render(<AiComposerContextMenu onChipsChange={handleChipsChange} initialChips={[]} />)

    await user.click(screen.getByRole('button', { name: 'Adicionar contexto ao chat' }))
    await user.click(screen.getByRole('menuitem', { name: /Arquivos recentes/i }))
    await user.click(screen.getByRole('menuitem', { name: /wireframes\.png/i }))

    expect(handleChipsChange).toHaveBeenCalledWith([
      expect.objectContaining({
        kind: 'file',
        type: 'file-rf3',
        label: 'wireframes.png',
        isImage: true,
        isMock: true,
      }),
    ])
  })
})
