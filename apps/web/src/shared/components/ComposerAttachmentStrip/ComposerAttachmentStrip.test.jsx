import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ComposerAttachmentStrip from './ComposerAttachmentStrip.jsx'

describe('ComposerAttachmentStrip', () => {
  it('renders image and file attachments in separate layouts', () => {
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
})
