import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCanvasState } from './useCanvasState.js'

describe('useCanvasState', () => {
  it('keeps local edits when the backing prop changes for the same plan', () => {
    const initialCanvasState = {
      cards: [],
      connections: [],
      pan: { x: 0, y: 0 },
      zoom: 1,
    }

    const { result, rerender } = renderHook(
      ({ activeCanvasState }) => useCanvasState({
        activePlanId: 'plan-1',
        activeCanvasState,
        updatePlanCanvas: vi.fn(),
        isBackendDriven: true,
        savePlanCanvas: vi.fn(),
      }),
      {
        initialProps: { activeCanvasState: initialCanvasState },
      },
    )

    act(() => {
      result.current.setCards((prev) => [
        ...prev,
        { id: 'card-1', x: 12, y: 24, h: 130, title: 'Novo', content: '', colorId: 'stone' },
      ])
    })

    rerender({
      activeCanvasState: {
        cards: [],
        connections: [],
        pan: { x: 60, y: 40 },
        zoom: 1,
      },
    })

    expect(result.current.cards).toHaveLength(1)
    expect(result.current.cards[0].id).toBe('card-1')
  })

  it('switches to the persisted canvas when the active plan changes', () => {
    const { result, rerender } = renderHook(
      ({ activePlanId, activeCanvasState }) => useCanvasState({
        activePlanId,
        activeCanvasState,
        updatePlanCanvas: vi.fn(),
        isBackendDriven: true,
        savePlanCanvas: vi.fn(),
      }),
      {
        initialProps: {
          activePlanId: 'plan-1',
          activeCanvasState: {
            cards: [{ id: 'card-1', x: 0, y: 0, h: 130, title: 'A', content: '', colorId: 'stone' }],
            connections: [],
            pan: { x: 0, y: 0 },
            zoom: 1,
          },
        },
      },
    )

    act(() => {
      result.current.setCards((prev) => [...prev, { id: 'card-2', x: 8, y: 8, h: 130, title: 'Local', content: '', colorId: 'stone' }])
    })

    rerender({
      activePlanId: 'plan-2',
      activeCanvasState: {
        cards: [{ id: 'remote-card', x: 100, y: 40, h: 130, title: 'Remoto', content: '', colorId: 'blue' }],
        connections: [],
        pan: { x: 15, y: 20 },
        zoom: 1.2,
      },
    })

    expect(result.current.cards).toEqual([
      { id: 'remote-card', x: 100, y: 40, h: 130, title: 'Remoto', content: '', colorId: 'blue' },
    ])
    expect(result.current.pan).toEqual({ x: 15, y: 20 })
    expect(result.current.zoom).toBe(1.2)
  })

  it('persists viewport changes only when explicitly requested', () => {
    vi.useFakeTimers()
    const savePlanCanvas = vi.fn().mockResolvedValue({
      cards: [],
      connections: [],
      pan: { x: 120, y: 60 },
      zoom: 1.5,
    })

    const { result } = renderHook(() => useCanvasState({
      activePlanId: 'plan-1',
      activeCanvasState: {
        cards: [],
        connections: [],
        pan: { x: 0, y: 0 },
        zoom: 1,
      },
      updatePlanCanvas: vi.fn(),
      isBackendDriven: true,
      savePlanCanvas,
    }))

    act(() => {
      result.current.setPan({ x: 120, y: 60 }, { persist: false })
      result.current.setZoom(1.5, { persist: false })
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(savePlanCanvas).not.toHaveBeenCalled()

    act(() => {
      result.current.persistCurrentState()
      vi.advanceTimersByTime(500)
    })

    expect(savePlanCanvas).toHaveBeenCalledTimes(1)
    expect(savePlanCanvas).toHaveBeenCalledWith('plan-1', {
      cards: [],
      connections: [],
      pan: { x: 120, y: 60 },
      zoom: 1.5,
    })

    vi.useRealTimers()
  })
})
