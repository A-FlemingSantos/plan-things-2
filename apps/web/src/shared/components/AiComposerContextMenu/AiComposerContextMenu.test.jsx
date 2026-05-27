import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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

describe('AiComposerContextMenu', () => {
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
})
