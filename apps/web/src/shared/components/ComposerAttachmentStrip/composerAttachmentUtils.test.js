import { describe, beforeEach, expect, it, vi } from 'vitest'
import {
  MAX_COMPOSER_ATTACHMENTS,
  appendClipboardImagesAsAttachments,
  appendFilesAsAttachments,
  countAttachmentChips,
  createMockRecentAttachment,
  estimateAttachmentItemWidth,
  estimateAttachmentsRowWidth,
  countAttachmentRows,
  getImageFilesFromClipboard,
  isAttachmentChip,
  partitionComposerChips,
  removeAttachmentChip,
  revokeAttachmentPreview,
  resolveCompactAttachmentLayout,
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
    expect(files[0].name).toMatch(/^clipboard-\d+-1\.png$/)
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

  it('estimates full-size attachment row width', () => {
    const attachments = [
      { isImage: true, label: 'photo.png' },
      { isImage: false, label: 'brief.pdf' },
    ]

    expect(estimateAttachmentItemWidth(attachments[0])).toBe(56)
    expect(estimateAttachmentsRowWidth(attachments)).toBe(56 + 8 + 54 + 9 * 6.5)
  })

  it('counts distinct attachment rows from child layout positions', () => {
    const container = document.createElement('div')
    const first = document.createElement('div')
    const second = document.createElement('div')
    const third = document.createElement('div')

    first.getBoundingClientRect = () => ({ top: 0 })
    second.getBoundingClientRect = () => ({ top: 0 })
    third.getBoundingClientRect = () => ({ top: 64 })

    container.append(first, second, third)

    expect(countAttachmentRows(container)).toBe(2)
  })

  it('resolves compact layout only when full-size attachments wrap', () => {
    const container = document.createElement('div')
    const first = document.createElement('div')
    const second = document.createElement('div')

    first.getBoundingClientRect = () => ({ top: 0 })
    second.getBoundingClientRect = () => ({ top: 64 })

    container.append(first, second)
    document.body.appendChild(container)

    expect(resolveCompactAttachmentLayout(container)).toBe(true)

    container.removeChild(second)
    expect(resolveCompactAttachmentLayout(container)).toBe(false)

    container.remove()
  })

  it('always clears the measuring flag even when row counting fails', () => {
    const container = document.createElement('div')
    const child = document.createElement('div')
    child.getBoundingClientRect = () => {
      throw new Error('layout unavailable')
    }
    container.append(child)
    document.body.appendChild(container)

    expect(() => resolveCompactAttachmentLayout(container)).toThrow('layout unavailable')
    expect(container.dataset.measuring).toBeUndefined()

    container.remove()
  })
})
