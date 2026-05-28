import { describe, beforeEach, expect, it, vi } from 'vitest'
import {
  MAX_COMPOSER_ATTACHMENTS,
  appendFilesAsAttachments,
  countAttachmentChips,
  createMockRecentAttachment,
  isAttachmentChip,
  partitionComposerChips,
  removeAttachmentChip,
  revokeAttachmentPreview,
} from './composerAttachmentUtils.js'

describe('composerAttachmentUtils', () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => 'blob:preview')
    window.URL.revokeObjectURL = vi.fn()
  })
  it('partitions attachment chips from inline context chips', () => {
    const chips = [
      { id: '1', kind: 'plan', type: 'plan-pl1', label: 'Plan' },
      { id: '2', kind: 'file', type: 'file-rf1', label: 'doc.pdf' },
      { id: '3', kind: 'connector', type: 'github', label: 'GitHub' },
    ]

    expect(partitionComposerChips(chips)).toEqual({
      attachments: [chips[1]],
      inlineChips: [chips[0], chips[2]],
    })
  })

  it('revokes blob preview urls on remove', () => {
    const chips = [
      { id: '1', kind: 'file', type: 'file-a', label: 'a.png', previewUrl: 'blob:preview-a' },
      { id: '2', kind: 'plan', type: 'plan-pl1', label: 'Plan' },
    ]

    const next = removeAttachmentChip(chips, 'file-a')

    expect(next).toHaveLength(1)
    expect(next[0].type).toBe('plan-pl1')
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-a')
  })

  it('does not revoke non-blob preview urls', () => {
    revokeAttachmentPreview({ previewUrl: 'https://example.com/image.png' })

    expect(window.URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('limits appended uploads to remaining attachment slots', async () => {
    const existing = Array.from({ length: MAX_COMPOSER_ATTACHMENTS }, (_, index) => ({
      id: `ctx-file-${index}`,
      kind: 'file',
      type: `file-${index}`,
      label: `file-${index}.pdf`,
    }))

    const files = [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.pdf', { type: 'application/pdf' }),
    ]

    const next = await appendFilesAsAttachments(existing, files)

    expect(next).toHaveLength(MAX_COMPOSER_ATTACHMENTS)
    expect(countAttachmentChips(next)).toBe(MAX_COMPOSER_ATTACHMENTS)
  })

  it('creates mock recent attachments with image flag', () => {
    const attachment = createMockRecentAttachment({
      id: 'rf3',
      name: 'wireframes.png',
      type: 'image',
    })

    expect(isAttachmentChip(attachment)).toBe(true)
    expect(attachment.isImage).toBe(true)
    expect(attachment.type).toBe('file-rf3')
  })
})
