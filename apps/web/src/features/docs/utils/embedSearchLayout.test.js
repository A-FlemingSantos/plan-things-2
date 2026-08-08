import { describe, expect, it } from 'vitest'
import { chunkResults, getItemAspectRatio, layoutEmbedRow } from './embedSearchLayout.js'

describe('embedSearchLayout', () => {
  it('chunks results into rows of three', () => {
    expect(chunkResults([1, 2, 3, 4, 5])).toEqual([[1, 2, 3], [4, 5]])
  })

  it('uses measured dimensions when available', () => {
    expect(getItemAspectRatio({ width: 0, height: 0 }, 'unsplash', { width: 1600, height: 900 })).toBe(1600 / 900)
  })

  it('assigns wider tiles to landscape images', () => {
    const row = [
      { id: 'a', width: 3000, height: 2000 },
      { id: 'b', width: 1000, height: 2000 },
      { id: 'c', width: 4000, height: 2000 },
    ]

    const layout = layoutEmbedRow(row, 'unsplash')
    const widths = layout.map((entry) => entry.width)

    expect(widths[1]).not.toBe(widths[0])
    expect(widths[2]).not.toBe(widths[0])
  })
})
