import { describe, expect, it } from 'vitest'
import { resolveRouteTransitionKey } from './App.jsx'

describe('resolveRouteTransitionKey', () => {
  it('keeps board route transitions stable while the plan id is resolved', () => {
    expect(resolveRouteTransitionKey('/workspace/board')).toBe('/workspace/board')
    expect(resolveRouteTransitionKey('/workspace/board/product-launch-q3')).toBe('/workspace/board')
    expect(resolveRouteTransitionKey('/workspace/board/product-launch-q3/')).toBe('/workspace/board')
  })

  it('keeps other product routes keyed by their normalized pathname', () => {
    expect(resolveRouteTransitionKey('/workspace')).toBe('/workspace')
    expect(resolveRouteTransitionKey('/settings')).toBe('/settings')
    expect(resolveRouteTransitionKey('/workspace/chat')).toBe('/workspace/chat')
    expect(resolveRouteTransitionKey('/workspace/chat/conv-1')).toBe('/workspace/chat/conv-1')
  })
})
