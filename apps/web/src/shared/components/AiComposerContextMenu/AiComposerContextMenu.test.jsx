import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AiComposerContextMenu from './AiComposerContextMenu.jsx'

const ChipIcon = () => null

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
