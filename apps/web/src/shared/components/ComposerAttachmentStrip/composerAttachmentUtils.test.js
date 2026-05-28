import { describe, beforeEach, expect, it, vi } from 'vitest'
import {
  MAX_COMPOSER_ATTACHMENTS,
  appendClipboardImagesAsAttachments,
  appendFilesAsAttachments,
  countAttachmentChips,
  createMockRecentAttachment,
  getImageFilesFromClipboard,
  isAttachmentChip,
  partitionComposerChips,
  removeAttachmentChip,
  revokeAttachmentPreview,
} from './composerAttachmentUtils.js'

describe('composerAttachmentUtils', () => {
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

  it('deduplicates repeated uploads of the same file', async () => {
    const file = new File(['a'], 'brief.pdf', { type: 'application/pdf', lastModified: 42 })

    const next = await appendFilesAsAttachments([], [file, file])

    expect(next).toHaveLength(1)
    expect(next[0]).toEqual(expect.objectContaining({
      kind: 'file',
      label: 'brief.pdf',
      type: expect.stringContaining('file-upload-brief-pdf'),
    }))
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

  it('extracts image files from clipboard data', () => {
    const imageFile = new File(['img'], 'shot.png', { type: 'image/png' })

    const files = getImageFilesFromClipboard({
      items: [
        { kind: 'string', type: 'text/plain', getAsFile: () => null },
        { kind: 'file', type: 'image/png', getAsFile: () => imageFile },
      ],
    })

    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('shot.png')
    expect(files[0].type).toBe('image/png')
  })

  it('assigns clipboard filenames when pasted blobs have no name', () => {
    const blob = new Blob(['img'], { type: 'image/png' })

    const files = getImageFilesFromClipboard({
      items: [{ kind: 'file', type: 'image/png', getAsFile: () => blob }],
    })

    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('clipboard-image-1.png')
  })

  it('appends clipboard images through the attachment pipeline', async () => {
    const imageFile = new File(['img'], 'shot.png', { type: 'image/png' })

    const result = await appendClipboardImagesAsAttachments([], {
      items: [{ kind: 'file', type: 'image/png', getAsFile: () => imageFile }],
    })

    expect(result.handled).toBe(true)
    expect(result.chips).toEqual([
      expect.objectContaining({
        kind: 'file',
        label: 'shot.png',
        isImage: true,
      }),
    ])
  })

  it('ignores non-image clipboard payloads', async () => {
    const result = await appendClipboardImagesAsAttachments([], {
      items: [{ kind: 'string', type: 'text/plain', getAsFile: () => null }],
    })

    expect(result).toEqual({ chips: [], handled: false })
  })

  it('does not intercept clipboard images when no attachment can be added', async () => {
    const existing = Array.from({ length: MAX_COMPOSER_ATTACHMENTS }, (_, index) => ({
      id: `ctx-file-${index}`,
      kind: 'file',
      type: `file-${index}`,
      label: `file-${index}.pdf`,
    }))
    const imageFile = new File(['img'], 'shot.png', { type: 'image/png' })

    const result = await appendClipboardImagesAsAttachments(existing, {
      items: [{ kind: 'file', type: 'image/png', getAsFile: () => imageFile }],
    })

    expect(result.handled).toBe(false)
    expect(result.chips).toBe(existing)
  })
})
