import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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
  it('renders image and file attachments in the default compact layout', () => {
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
    expect(screen.getByRole('group', { name: 'Anexos adicionados' })).toHaveAttribute('data-compact', 'true')
  })

  it('notifies parent when an attachment is removed', async () => {
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

  it('survives rapid attach and detach cycles without throwing', () => {
    const { rerender } = render(
      <ComposerAttachmentStrip
        attachments={[createAttachment(1, { isImage: true, label: 'photo-1.png' })]}
        onRemove={vi.fn()}
      />,
    )

    rerender(
      <ComposerAttachmentStrip
        attachments={[
          createAttachment(1, { isImage: true, label: 'photo-1.png' }),
          createAttachment(2, { isImage: false, label: 'brief.pdf' }),
        ]}
        onRemove={vi.fn()}
      />,
    )

    rerender(
      <ComposerAttachmentStrip
        attachments={[]}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.queryByRole('group', { name: 'Anexos adicionados' })).not.toBeInTheDocument()
  })
})
