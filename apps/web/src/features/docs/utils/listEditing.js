import { Extension } from '@tiptap/core'
import { Selection } from '@tiptap/pm/state'

const LIST_WRAPPERS = new Set(['bulletList', 'orderedList'])

/**
 * "+" insert control should only target document-level empty paragraphs —
 * not empty paragraphs nested inside list items (or other wrappers).
 */
export function isTopLevelEmptyParagraph($from) {
  return (
    $from.depth === 1
    && $from.parent?.type?.name === 'paragraph'
    && $from.parent.content.size === 0
  )
}

function deleteEmptyListItem(editor, $from) {
  if ($from.depth < 2) return false
  if ($from.node(-1).type.name !== 'listItem') return false
  // Cursor must be at the start of the list item's first block.
  if ($from.index($from.depth - 1) !== 0 || $from.parentOffset !== 0) return false
  if ($from.parent.type.name !== 'paragraph' || $from.parent.content.size !== 0) return false

  const listItem = $from.node(-1)
  // Nested content (e.g. sub-list) — keep TipTap's default lift behaviour.
  if (listItem.childCount !== 1) return false

  const list = $from.node(-2)
  if (!list || !LIST_WRAPPERS.has(list.type.name)) return false
  // Sole empty item: allow default lift so the user can exit the list.
  if (list.childCount <= 1) return false

  const itemIndex = $from.index(-2)
  const from = $from.before(-1)
  const to = $from.after(-1)

  return editor.chain().command(({ tr, dispatch }) => {
    if (!dispatch) return true
    tr.delete(from, to)
    const target = itemIndex > 0 ? from - 1 : from
    const maxPos = tr.doc.content.size
    const pos = Math.max(1, Math.min(target, maxPos))
    tr.setSelection(Selection.near(tr.doc.resolve(pos), itemIndex > 0 ? -1 : 1))
    return true
  }).run()
}

function joinListsAroundEmptyParagraph(editor, $from) {
  if ($from.depth !== 1) return false
  if ($from.parent.type.name !== 'paragraph' || $from.parent.content.size !== 0) return false
  if ($from.parentOffset !== 0) return false

  const { doc } = editor.state
  const index = $from.index(0)
  if (index <= 0 || index >= doc.childCount - 1) return false

  const before = doc.child(index - 1)
  const after = doc.child(index + 1)
  if (before.type !== after.type || !LIST_WRAPPERS.has(before.type.name)) return false

  const paraFrom = $from.before(1)
  const paraTo = $from.after(1)

  return editor.chain().command(({ tr, dispatch }) => {
    if (!dispatch) return true
    tr.delete(paraFrom, paraTo)
    const $join = tr.doc.resolve(paraFrom)
    if ($join.nodeBefore && $join.nodeAfter && $join.nodeBefore.type === $join.nodeAfter.type) {
      tr.join(paraFrom)
    }
    const maxPos = tr.doc.content.size
    const pos = Math.max(1, Math.min(paraFrom - 1, maxPos))
    tr.setSelection(Selection.near(tr.doc.resolve(pos), -1))
    return true
  }).run()
}

/**
 * TipTap's ListKeymap Backspace always lifts an empty list item, which splits
 * ordered/bullet lists in the middle and resets numbering. Prefer deleting the
 * empty item (and repairing already-split adjacent lists).
 */
export function handleListAwareBackspace(editor) {
  if (!editor || editor.isDestroyed) return false
  const { selection } = editor.state
  const { $from, empty } = selection
  if (!empty) return false
  if ($from.parent?.type?.name !== 'paragraph') return false
  if ($from.parentOffset !== 0) return false

  if (joinListsAroundEmptyParagraph(editor, $from)) return true
  if (deleteEmptyListItem(editor, $from)) return true
  return false
}

export const DocsListKeymap = Extension.create({
  name: 'docsListKeymap',
  // Run before StarterKit's ListKeymap (default priority 100).
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => handleListAwareBackspace(editor),
      'Mod-Backspace': ({ editor }) => handleListAwareBackspace(editor),
    }
  },
})
