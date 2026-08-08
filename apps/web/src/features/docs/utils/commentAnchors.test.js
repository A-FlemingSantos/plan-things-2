import { describe, expect, it } from 'vitest'
import {
  filterAnchoredComments,
  findQuoteTopAtOccurrence,
  getQuoteOccurrenceIndex,
  isCommentAnchored,
} from './commentAnchors.js'

describe('commentAnchors', () => {
  it('validates anchors against the stored markdown range', () => {
    const content = 'Hello world\nSecond line'
    const comment = {
      id: '1',
      quotedText: 'world',
      selectionStart: 6,
      selectionEnd: 11,
    }

    expect(isCommentAnchored(content, comment)).toBe(true)
    expect(isCommentAnchored('Hello there', comment)).toBe(false)
  })

  it('does not treat a retyped duplicate quote as the same anchor', () => {
    const original = 'Alpha beta gamma'
    const edited = 'Alpha  gamma beta'
    const comment = {
      id: '1',
      quotedText: 'beta',
      selectionStart: 6,
      selectionEnd: 10,
    }

    expect(isCommentAnchored(original, comment)).toBe(true)
    expect(isCommentAnchored(edited, comment)).toBe(false)
  })

  it('resolves the nth quote occurrence from a markdown offset', () => {
    const content = 'repeat repeat repeat'
    expect(getQuoteOccurrenceIndex(content, 'repeat', 0)).toBe(0)
    expect(getQuoteOccurrenceIndex(content, 'repeat', 7)).toBe(1)
    expect(getQuoteOccurrenceIndex(content, 'repeat', 14)).toBe(2)
    expect(getQuoteOccurrenceIndex('repeat repeat', 'repeat', 6)).toBe(-1)
  })

  it('filters out comments whose anchors no longer match', () => {
    const comments = [
      { id: '1', quotedText: 'keep', selectionStart: 0, selectionEnd: 4 },
      { id: '2', quotedText: 'gone', selectionStart: 10, selectionEnd: 14 },
    ]

    expect(filterAnchoredComments('keep text', comments)).toEqual([comments[0]])
  })

  it('finds the requested occurrence inside rendered text nodes', () => {
    const editorRoot = document.createElement('div')
    editorRoot.append(document.createTextNode('Alpha beta beta'))
    const composerMain = document.createElement('div')
    document.body.append(composerMain, editorRoot)
    composerMain.getBoundingClientRect = () => ({ top: 100, left: 0, width: 0, height: 0, right: 0, bottom: 0 })
    editorRoot.getBoundingClientRect = () => ({ top: 120, left: 0, width: 0, height: 0, right: 0, bottom: 0 })

    const originalGetBoundingClientRect = Range.prototype.getBoundingClientRect
    Range.prototype.getBoundingClientRect = function mockRangeRect() {
      return { top: 130, left: 0, width: 0, height: 0, right: 0, bottom: 0 }
    }

    try {
      expect(findQuoteTopAtOccurrence(editorRoot, composerMain, 'beta', 1)).toBe(30)
    } finally {
      Range.prototype.getBoundingClientRect = originalGetBoundingClientRect
      editorRoot.remove()
      composerMain.remove()
    }
  })
})
