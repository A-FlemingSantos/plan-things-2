import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => 'blob:preview')
    window.URL.revokeObjectURL = vi.fn()

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(new Blob(['preview'], { type: 'image/png' }))
    })

    global.Image = class MockImage {
      set src(_value) {
        queueMicrotask(() => {
          this.onload?.()
        })
      }
    }
  })

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

  it('grows the prompt input up to seven lines before scrolling', () => {
    const originalGetComputedStyle = window.getComputedStyle

    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
      if (element.getAttribute('aria-label') === 'Prompt do Intelligence') {
        return {
          ...originalGetComputedStyle(element),
          lineHeight: '20px',
          paddingTop: '0px',
          paddingBottom: '0px',
          borderTopWidth: '0px',
          borderBottomWidth: '0px',
        }
      }

      return originalGetComputedStyle(element)
    })

    const { rerender } = render(
      <IntelligenceComposer
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        classes={baseClasses}
        rows={1}
      />,
    )

    const textarea = screen.getByLabelText('Prompt do Intelligence')
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      value: 220,
    })

    rerender(
      <IntelligenceComposer
        value={'1\n2\n3\n4\n5\n6\n7\n8'}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        classes={baseClasses}
        rows={1}
      />,
    )

    expect(textarea.style.height).toBe('140px')
    expect(textarea.style.overflowY).toBe('auto')
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

  it('renders attachment strip above the prompt input', () => {
    render(
      <IntelligenceComposer
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        classes={baseClasses}
        aiChips={[
          {
            id: 'ctx-file-rf2',
            type: 'file-rf2',
            kind: 'file',
            label: 'requisitos.pdf',
            isImage: false,
          },
        ]}
        onChipsChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('group', { name: 'Anexos adicionados' })).toBeInTheDocument()
    expect(screen.getByText('requisitos.pdf')).toBeInTheDocument()
    expect(screen.getByLabelText('Prompt do Intelligence')).toHaveAttribute('data-has-attachments', 'true')
  })

  it('revokes blob previews when removing attachments from the strip', async () => {
    const user = userEvent.setup()
    const handleChipsChange = vi.fn()

    render(
      <IntelligenceComposer
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        classes={baseClasses}
        aiChips={[
          {
            id: 'ctx-file-a',
            type: 'file-a',
            kind: 'file',
            label: 'photo.png',
            isImage: true,
            previewUrl: 'blob:preview-a',
          },
        ]}
        onChipsChange={handleChipsChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Remover photo.png' }))

    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-a')
    expect(handleChipsChange).toHaveBeenCalledWith([])
  })

  it('adds pasted clipboard images as attachments', async () => {
    const handleChipsChange = vi.fn()
    const imageFile = new File(['img'], 'shot.png', { type: 'image/png' })

    render(
      <IntelligenceComposer
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        classes={baseClasses}
        onChipsChange={handleChipsChange}
      />,
    )

    fireEvent.paste(screen.getByLabelText('Prompt do Intelligence'), {
      clipboardData: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => imageFile }],
      },
    })

    await waitFor(() => {
      expect(handleChipsChange).toHaveBeenCalledWith([
        expect.objectContaining({
          kind: 'file',
          label: 'shot.png',
          isImage: true,
        }),
      ])
    })
  })

  it('does not intercept plain-text paste', () => {
    const handleChipsChange = vi.fn()

    render(
      <IntelligenceComposer
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        classes={baseClasses}
        onChipsChange={handleChipsChange}
      />,
    )

    fireEvent.paste(screen.getByLabelText('Prompt do Intelligence'), {
      clipboardData: {
        items: [{ kind: 'string', type: 'text/plain', getAsFile: () => null }],
      },
    })

    expect(handleChipsChange).not.toHaveBeenCalled()
  })
})
