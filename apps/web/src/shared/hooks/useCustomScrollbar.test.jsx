import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import useCustomScrollbar from './useCustomScrollbar.js'

function TestScrollbar() {
  const scrollbar = useCustomScrollbar()

  return (
    <div>
      <div data-testid="viewport" ref={scrollbar.viewportRef}>
        <div>Scrollable content</div>
      </div>
      <span data-testid="thumb" ref={scrollbar.thumbRef} onPointerDown={scrollbar.handleThumbPointerDown} />
    </div>
  )
}

function installScrollMetrics(element, metrics) {
  let scrollTop = metrics.scrollTop ?? 0

  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    get: () => metrics.clientHeight,
  })
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    get: () => metrics.scrollHeight,
  })
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (value) => {
      scrollTop = value
    },
  })
}

describe('useCustomScrollbar', () => {
  it('measures and positions the thumb during scroll when the first layout pass was stale', async () => {
    render(<TestScrollbar />)

    const viewport = screen.getByTestId('viewport')
    const thumb = screen.getByTestId('thumb')

    installScrollMetrics(viewport, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 0,
    })

    viewport.scrollTop = 100
    fireEvent.scroll(viewport)

    await waitFor(() => {
      expect(thumb.style.height).toBe('33px')
      expect(thumb.style.transform).toBe('translate3d(0, 33.5px, 0)')
    })
  })

  it('recalculates thumb size while scrolling when content height changes', async () => {
    const metrics = {
      clientHeight: 100,
      scrollHeight: 200,
      scrollTop: 0,
    }

    render(<TestScrollbar />)

    const viewport = screen.getByTestId('viewport')
    const thumb = screen.getByTestId('thumb')

    installScrollMetrics(viewport, metrics)

    viewport.scrollTop = 50
    fireEvent.scroll(viewport)
    await waitFor(() => expect(thumb.style.height).toBe('50px'))

    metrics.scrollHeight = 400
    viewport.scrollTop = 150
    fireEvent.scroll(viewport)

    await waitFor(() => {
      expect(thumb.style.height).toBe('25px')
      expect(thumb.style.transform).toBe('translate3d(0, 37.5px, 0)')
    })
  })
})
