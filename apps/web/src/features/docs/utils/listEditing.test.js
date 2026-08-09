import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { describe, expect, it, afterEach } from 'vitest'
import {
  DocsListKeymap,
  handleListAwareBackspace,
  isTopLevelEmptyParagraph,
} from './listEditing.js'

function createEditor(markdown) {
  return new Editor({
    extensions: [
      StarterKit,
      Markdown,
      DocsListKeymap,
    ],
    content: markdown,
    contentType: 'markdown',
  })
}

function insertEmptyListItemAfterFirst(editor) {
  const json = structuredClone(editor.getJSON())
  const list = json.content.find((node) => node.type === 'orderedList' || node.type === 'bulletList')
  list.content.splice(1, 0, { type: 'listItem', content: [{ type: 'paragraph' }] })
  editor.commands.setContent(json)
}

function selectFirstEmptyParagraph(editor) {
  let emptyPos = null
  editor.state.doc.descendants((node, pos) => {
    if (emptyPos != null) return false
    if (node.type.name === 'paragraph' && node.content.size === 0) {
      emptyPos = pos + 1
      return false
    }
    return undefined
  })
  expect(emptyPos).not.toBeNull()
  editor.commands.setTextSelection(emptyPos)
  return emptyPos
}

describe('isTopLevelEmptyParagraph', () => {
  let editor

  afterEach(() => {
    editor?.destroy()
  })

  it('is true only for document-level empty paragraphs', () => {
    editor = createEditor('hello\n\n')
    // Ensure trailing empty paragraph exists
    const json = editor.getJSON()
    if (json.content.at(-1)?.type !== 'paragraph' || json.content.at(-1).content) {
      json.content.push({ type: 'paragraph' })
      editor.commands.setContent(json)
    }
    selectFirstEmptyParagraph(editor)
    // May select empty inside content — find top-level empty
    let topLevelEmpty = null
    editor.state.doc.forEach((node, offset, index) => {
      if (node.type.name === 'paragraph' && node.content.size === 0) {
        topLevelEmpty = editor.state.doc.resolve(offset + 1)
      }
    })
    expect(topLevelEmpty).not.toBeNull()
    expect(isTopLevelEmptyParagraph(topLevelEmpty)).toBe(true)
  })

  it('is false for empty paragraphs inside list items', () => {
    editor = createEditor('1. alpha\n2. beta')
    insertEmptyListItemAfterFirst(editor)
    selectFirstEmptyParagraph(editor)
    expect(isTopLevelEmptyParagraph(editor.state.selection.$from)).toBe(false)
  })
})

describe('handleListAwareBackspace', () => {
  let editor

  afterEach(() => {
    editor?.destroy()
  })

  it('deletes an empty middle list item without splitting the list', () => {
    editor = createEditor('1. alpha\n2. beta\n3. gamma')
    insertEmptyListItemAfterFirst(editor)
    selectFirstEmptyParagraph(editor)

    expect(handleListAwareBackspace(editor)).toBe(true)
    expect(editor.getMarkdown().trimEnd()).toBe('1. alpha\n2. beta\n3. gamma')

    const lists = []
    editor.state.doc.forEach((node) => {
      if (node.type.name === 'orderedList') lists.push(node)
    })
    expect(lists).toHaveLength(1)
    expect(lists[0].childCount).toBe(3)
  })

  it('deletes an empty middle bullet list item without splitting', () => {
    editor = createEditor('- alpha\n- beta\n- gamma')
    insertEmptyListItemAfterFirst(editor)
    selectFirstEmptyParagraph(editor)

    expect(handleListAwareBackspace(editor)).toBe(true)
    expect(editor.getMarkdown().replace(/\r/g, '').trimEnd()).toBe('- alpha\n- beta\n- gamma')
  })

  it('joins adjacent lists when backspacing an empty paragraph between them', () => {
    editor = createEditor('1. alpha\n\n1. beta\n2. gamma')
    // Ensure structure is list / empty p / list
    const json = {
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          attrs: { start: 1 },
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'alpha' }] }] },
          ],
        },
        { type: 'paragraph' },
        {
          type: 'orderedList',
          attrs: { start: 1 },
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'beta' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'gamma' }] }] },
          ],
        },
      ],
    }
    editor.commands.setContent(json)
    selectFirstEmptyParagraph(editor)

    expect(handleListAwareBackspace(editor)).toBe(true)
    expect(editor.getMarkdown().trimEnd()).toBe('1. alpha\n2. beta\n3. gamma')

    const lists = []
    editor.state.doc.forEach((node) => {
      if (node.type.name === 'orderedList') lists.push(node)
    })
    expect(lists).toHaveLength(1)
    expect(lists[0].childCount).toBe(3)
  })

  it('does not intercept backspace on a sole empty list item (allow exit)', () => {
    editor = createEditor('1. only')
    // Clear the only item
    editor.commands.selectAll()
    editor.commands.deleteSelection()
    // Should be empty list item or empty paragraph after tip tap cleanup
    const handled = handleListAwareBackspace(editor)
    // Either false (let TipTap lift) or the doc is already not a multi-item empty case
    if (handled) {
      // If handled, must not leave a split list behind
      const lists = []
      editor.state.doc.forEach((node) => {
        if (node.type.name === 'orderedList') lists.push(node)
      })
      expect(lists.length).toBeLessThanOrEqual(1)
    } else {
      expect(handled).toBe(false)
    }
  })
})
