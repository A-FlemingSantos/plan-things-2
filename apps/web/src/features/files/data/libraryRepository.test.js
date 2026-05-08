import { describe, expect, it } from 'vitest'
import {
  createLibraryItem,
  flattenLibrary,
  removeLibraryItem,
  restoreLibraryItem,
} from './libraryRepository.js'

describe('libraryRepository trash helpers', () => {
  it('restores a folder subtree from the demo trash', () => {
    const child = createLibraryItem({ id: 'child', name: 'Child', type: 'doc', deleted: true })
    const root = createLibraryItem({
      id: 'root',
      name: 'Root',
      type: 'folder',
      deleted: true,
      children: [child],
    })

    const restored = restoreLibraryItem([root], 'root')

    expect(flattenLibrary(restored).map((item) => [item.id, item.deleted])).toEqual([
      ['root', false],
      ['child', false],
    ])
  })

  it('removes a folder subtree permanently from the demo library', () => {
    const root = createLibraryItem({
      id: 'root',
      name: 'Root',
      type: 'folder',
      deleted: true,
      children: [
        createLibraryItem({ id: 'child', name: 'Child', type: 'doc', deleted: true }),
      ],
    })

    expect(removeLibraryItem([root], 'root')).toEqual([])
  })
})
