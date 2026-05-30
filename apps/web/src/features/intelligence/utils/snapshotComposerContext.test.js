import { describe, expect, it } from 'vitest'
import { COMPOSER_CHIP_KIND_CARD } from '../../../shared/components/ComposerChip/composerChipPresentation.jsx'
import {
  hasComposerContext,
  hasContextSnapshot,
  keepComposerInlineChips,
  snapshotComposerContext,
} from './snapshotComposerContext.js'

const ChipIcon = () => null

describe('snapshotComposerContext', () => {
  it('partitions attachments and inline chips into an immutable snapshot', () => {
    const chips = [
      { id: '1', kind: 'plan', type: 'plan-pl1', label: 'Plan A', ChipIcon },
      { id: '2', kind: 'file', type: 'file-img', label: 'photo.png', isImage: true, previewUrl: 'blob:img' },
      { id: '3', kind: 'file', type: 'file-doc', label: 'brief.pdf', isImage: false },
      { id: '4', kind: 'connector', type: 'github', label: 'GitHub', ChipIcon },
    ]

    const snapshot = snapshotComposerContext(chips)

    expect(snapshot.imageAttachments).toHaveLength(1)
    expect(snapshot.imageAttachments[0].label).toBe('photo.png')
    expect(snapshot.fileAttachments).toHaveLength(1)
    expect(snapshot.fileAttachments[0].label).toBe('brief.pdf')
    expect(snapshot.contextChips).toHaveLength(2)
    expect(snapshot.contextChips.map((chip) => chip.label)).toEqual(['Plan A', 'GitHub'])
  })

  it('preserves card chips in the context snapshot', () => {
    const chips = [
      { id: '1', kind: COMPOSER_CHIP_KIND_CARD, type: 'card-card-1', label: 'Login UI', ChipIcon },
      { id: '2', kind: 'file', type: 'file-a', label: 'a.png', isImage: true },
    ]

    const snapshot = snapshotComposerContext(chips)

    expect(snapshot.contextChips).toEqual([
      expect.objectContaining({ kind: COMPOSER_CHIP_KIND_CARD, label: 'Login UI' }),
    ])
  })

  it('clones snapshot data without mutating the composer chips', () => {
    const chips = [
      { id: '1', kind: 'file', type: 'file-a', label: 'a.png', isImage: true, previewUrl: 'blob:a' },
    ]

    const snapshot = snapshotComposerContext(chips)
    snapshot.imageAttachments[0].label = 'changed'

    expect(chips[0].label).toBe('a.png')
  })

  it('keeps inline chips when stripping composer attachments', () => {
    const chips = [
      { id: '1', kind: 'plan', type: 'plan-pl1', label: 'Plan A', ChipIcon },
      { id: '2', kind: 'file', type: 'file-a', label: 'a.png', isImage: true },
    ]

    expect(keepComposerInlineChips(chips)).toEqual([
      expect.objectContaining({ label: 'Plan A' }),
    ])
  })

  it('detects composer and snapshot context', () => {
    expect(hasComposerContext([])).toBe(false)
    expect(hasComposerContext([{ id: '1', kind: 'connector', type: 'github', label: 'GitHub' }])).toBe(true)
    expect(hasContextSnapshot(snapshotComposerContext([
      { id: '1', kind: 'file', type: 'file-a', label: 'a.pdf', isImage: false },
    ]))).toBe(true)
    expect(hasContextSnapshot(null)).toBe(false)
  })
})
