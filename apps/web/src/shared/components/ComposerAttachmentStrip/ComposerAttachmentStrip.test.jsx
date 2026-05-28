import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as composerAttachmentUtils from './composerAttachmentUtils.js'
import ComposerAttachmentStrip from './ComposerAttachmentStrip.jsx'

function createAttachment(index, { isImage = false, label = `file-${index}.pdf` } = {}) {
  return {
    id: String(index),
    type: `file-${index}`,
    label,
    isImage,
    previewUrl: isImage ? `blob:file-${index}` : undefined,
  }
}

describe('ComposerAttachmentStrip', () => {
  let resizeObserverCallback

  beforeEach(() => {
    resizeObserverCallback = null
    vi.restoreAllMocks()

    global.ResizeObserver = vi.fn(function ResizeObserver(callback) {
      resizeObserverCallback = callback
      this.observe = vi.fn()
      this.disconnect = vi.fn()
    })

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  it('renders image and file attachments in separate layouts', async () => {
    vi.spyOn(composerAttachmentUtils, 'countAttachmentRows').mockReturnValue(1)

    render(
      <ComposerAttachmentStrip
        attachments={[
          {
            id: '1',
            type: 'file-a',
            label: 'photo.png',
            isImage: true,
            previewUrl: 'blob:photo',
          },
          {
            id: '2',
            type: 'file-b',
            label: 'brief.pdf',
            isImage: false,
          },
        ]}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByRole('img', { name: 'photo.png' })).toBeInTheDocument()
    expect(screen.getByText('brief.pdf')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('group', { name: 'Anexos adicionados' })).toHaveAttribute('data-compact', 'false')
    })
  })

  it('notifies parent when an attachment is removed', async () => {
    vi.spyOn(composerAttachmentUtils, 'countAttachmentRows').mockReturnValue(1)

    const user = userEvent.setup()
    const handleRemove = vi.fn()
    const attachment = {
      id: '1',
      type: 'file-a',
      label: 'brief.pdf',
      isImage: false,
    }

    render(
      <ComposerAttachmentStrip
        attachments={[attachment]}
        onRemove={handleRemove}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Remover brief.pdf' }))

    expect(handleRemove).toHaveBeenCalledWith(attachment)
  })

  it('uses compact layout when full-size attachments wrap to multiple rows', async () => {
    vi.spyOn(composerAttachmentUtils, 'countAttachmentRows').mockReturnValue(2)

    render(
      <ComposerAttachmentStrip
        attachments={Array.from({ length: 5 }, (_, index) => (
          createAttachment(index + 1, { isImage: true, label: `photo-${index + 1}.png` })
        ))}
        onRemove={vi.fn()}
      />,
    )

    resizeObserverCallback?.([], { observe: vi.fn(), disconnect: vi.fn() })

    await waitFor(() => {
      expect(screen.getByRole('group', { name: 'Anexos adicionados' })).toHaveAttribute('data-compact', 'true')
    })
  })

  it('keeps full-size layout when attachments stay on one row', async () => {
    vi.spyOn(composerAttachmentUtils, 'countAttachmentRows').mockReturnValue(1)

    render(
      <ComposerAttachmentStrip
        attachments={[createAttachment(1, { isImage: true, label: 'photo.png' })]}
        onRemove={vi.fn()}
      />,
    )

    resizeObserverCallback?.([], { observe: vi.fn(), disconnect: vi.fn() })

    await waitFor(() => {
      expect(screen.getByRole('group', { name: 'Anexos adicionados' })).toHaveAttribute('data-compact', 'false')
    })
  })
})
