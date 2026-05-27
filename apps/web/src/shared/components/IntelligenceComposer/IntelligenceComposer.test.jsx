import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import IntelligenceComposer from './IntelligenceComposer.jsx'

vi.mock('framer-motion', () => ({
  motion: {
    form: ({ layout, layoutId, children, ...props }) => <form {...props}>{children}</form>,
  },
}))

vi.mock('../AiComposerContextMenu/AiComposerContextMenu.jsx', () => ({
  default: () => <div aria-label="Menu de contexto do composer" />,
}))

vi.mock('../GitHubContextBar/GitHubContextBar.jsx', () => ({
  default: () => <div aria-label="Barra GitHub" />,
}))

const baseClasses = {
  form: 'form',
  input: 'input',
  controls: 'controls',
  contextSlot: 'context',
  actions: 'actions',
  iconButton: 'icon',
  iconButtonActive: 'icon-active',
  sendButton: 'send',
}

describe('IntelligenceComposer', () => {
  it('renders prompt input and disables submit when empty', () => {
    render(
      <IntelligenceComposer
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        classes={baseClasses}
      />,
    )

    expect(screen.getByLabelText('Prompt do Intelligence')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar prompt ao Intelligence' })).toBeDisabled()
  })

  it('submits on Enter without Shift', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn((event) => event.preventDefault())

    render(
      <IntelligenceComposer
        value="Olá"
        onChange={vi.fn()}
        onSubmit={handleSubmit}
        classes={baseClasses}
      />,
    )

    await user.type(screen.getByLabelText('Prompt do Intelligence'), '{Enter}')

    expect(handleSubmit).toHaveBeenCalled()
  })

  it('places GitHub bar inside the form when requested', () => {
    const { container } = render(
      <IntelligenceComposer
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        classes={baseClasses}
        showGitHubBar
        githubBarPlacement="insideForm"
      />,
    )

    const form = container.querySelector('form')
    expect(form).toContainElement(screen.getByLabelText('Barra GitHub'))
  })
})
