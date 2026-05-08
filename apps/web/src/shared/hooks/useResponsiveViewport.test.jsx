import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useResponsiveViewport } from './useResponsiveViewport.js'
import { installMatchMediaController } from '../../test/matchMedia.js'

function ViewportProbe() {
  const viewport = useResponsiveViewport()

  return (
    <output data-testid="viewport-state">
      {JSON.stringify(viewport)}
    </output>
  )
}

describe('useResponsiveViewport', () => {
  it('reports compact mobile, mobile, tablet and desktop breakpoints', () => {
    const controller = installMatchMediaController(390)

    render(<ViewportProbe />)

    expect(screen.getByTestId('viewport-state')).toHaveTextContent('"breakpoint":"compact-mobile"')
    expect(screen.getByTestId('viewport-state')).toHaveTextContent('"isMobile":true')

    act(() => controller.setWidth(720))
    expect(screen.getByTestId('viewport-state')).toHaveTextContent('"breakpoint":"mobile"')
    expect(screen.getByTestId('viewport-state')).toHaveTextContent('"isCompactMobile":false')

    act(() => controller.setWidth(900))
    expect(screen.getByTestId('viewport-state')).toHaveTextContent('"breakpoint":"tablet"')
    expect(screen.getByTestId('viewport-state')).toHaveTextContent('"isTablet":true')

    act(() => controller.setWidth(1280))
    expect(screen.getByTestId('viewport-state')).toHaveTextContent('"breakpoint":"desktop"')
    expect(screen.getByTestId('viewport-state')).toHaveTextContent('"isDesktop":true')
  })
})
