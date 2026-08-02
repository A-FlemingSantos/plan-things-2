import { describe, expect, it } from 'vitest'
import { resolveRouteTransitionKey } from './App.jsx'
import { ROUTES } from './shared/config/routes.js'

describe('resolveRouteTransitionKey', () => {
  it('keeps board route transitions stable while the plan id is resolved', () => {
    expect(resolveRouteTransitionKey('/workspace/board')).toBe('/workspace/board')
    expect(resolveRouteTransitionKey('/workspace/board/product-launch-q3')).toBe('/workspace/board')
    expect(resolveRouteTransitionKey('/workspace/board/product-launch-q3/')).toBe('/workspace/board')
  })

  it('keeps other product routes keyed by their normalized pathname', () => {
    expect(resolveRouteTransitionKey('/workspace')).toBe('/workspace')
    expect(resolveRouteTransitionKey('/settings')).toBe('/settings')
    expect(resolveRouteTransitionKey(ROUTES.calendar)).toBe(ROUTES.calendar)
    expect(resolveRouteTransitionKey(ROUTES.files)).toBe(ROUTES.files)
  })
})
