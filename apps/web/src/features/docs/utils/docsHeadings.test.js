import { describe, expect, it } from 'vitest'
import {
  buildHeadingTree,
  extractMarkdownHeadings,
  findDocHeadingElement,
  findHeadingAncestorIds,
  tagDocHeadingElements,
} from './docsHeadings.js'

describe('extractMarkdownHeadings', () => {
  it('collects ATX headings in order', () => {
    const headings = extractMarkdownHeadings([
      '# One',
      '',
      'para',
      '## Two',
      '### Three',
    ].join('\n'))

    expect(headings.map((item) => item.label)).toEqual(['One', 'Two', 'Three'])
    expect(headings.map((item) => item.headingIndex)).toEqual([0, 1, 2])
    expect(headings.map((item) => item.level)).toEqual([1, 2, 3])
  })

  it('ignores headings inside fenced code blocks', () => {
    const headings = extractMarkdownHeadings([
      '# Real',
      '```',
      '# Fake',
      '```',
      '## Also real',
    ].join('\n'))

    expect(headings.map((item) => item.label)).toEqual(['Real', 'Also real'])
  })
})

describe('buildHeadingTree', () => {
  it('nests headings by level', () => {
    const tree = buildHeadingTree(extractMarkdownHeadings([
      '# One',
      '## Two',
      '### Three',
      '## Four',
      '# Five',
    ].join('\n')))

    expect(tree).toHaveLength(2)
    expect(tree[0].label).toBe('One')
    expect(tree[0].children.map((child) => child.label)).toEqual(['Two', 'Four'])
    expect(tree[0].children[0].children.map((child) => child.label)).toEqual(['Three'])
    expect(tree[1].label).toBe('Five')
    expect(tree[1].children).toEqual([])
  })

  it('attaches skipped levels under the nearest shallower ancestor', () => {
    const tree = buildHeadingTree(extractMarkdownHeadings([
      '# One',
      '### Deep',
    ].join('\n')))

    expect(tree).toHaveLength(1)
    expect(tree[0].children.map((child) => child.label)).toEqual(['Deep'])
  })
})

describe('findHeadingAncestorIds', () => {
  it('returns ancestor ids for a nested heading', () => {
    const headings = extractMarkdownHeadings([
      '# One',
      '## Two',
      '### Three',
    ].join('\n'))
    const tree = buildHeadingTree(headings)
    expect(findHeadingAncestorIds(tree, 2)).toEqual(['doc-heading-0', 'doc-heading-1'])
    expect(findHeadingAncestorIds(tree, 0)).toEqual([])
  })
})

describe('tagDocHeadingElements', () => {
  it('tags headings with stable indices and finds them back', () => {
    const root = document.createElement('div')
    root.innerHTML = '<h1>A</h1><p>x</p><h2>B</h2><h3>C</h3>'

    const tagged = tagDocHeadingElements(root)
    expect(tagged).toHaveLength(3)
    expect(tagged[1].getAttribute('data-doc-heading')).toBe('1')
    expect(tagged[1].id).toBe('doc-heading-1')
    expect(findDocHeadingElement(root, 2)?.textContent).toBe('C')
  })

  it('ignores the page title outside data-docs-body', () => {
    const root = document.createElement('div')
    root.innerHTML = [
      '<h1 class="docTitle">Page title</h1>',
      '<div data-docs-body="">',
      '<h1>One</h1>',
      '<h2>Two</h2>',
      '</div>',
    ].join('')

    const tagged = tagDocHeadingElements(root)
    expect(tagged.map((el) => el.textContent)).toEqual(['One', 'Two'])
    expect(findDocHeadingElement(root, 0)?.textContent).toBe('One')
    expect(root.querySelector('.docTitle').hasAttribute('data-doc-heading')).toBe(false)
  })
})
