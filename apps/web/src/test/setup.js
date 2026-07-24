import * as matchers from '@testing-library/jest-dom/matchers'

import { afterEach, beforeAll, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

expect.extend(matchers)

vi.mock('framer-motion', async () => {
  const React = await import('react')

  const stripMotionProps = ({
    animate,
    children,
    drag,
    dragConstraints,
    dragElastic,
    exit,
    initial,
    layout,
    layoutId,
    transition,
    variants,
    whileFocus,
    whileHover,
    whileInView,
    whileTap,
    ...props
  }) => ({ children, props })

  const createMotionComponent = (tag) => React.forwardRef((componentProps, ref) => {
    const { children, props } = stripMotionProps(componentProps)
    return React.createElement(tag, { ...props, ref }, children)
  })
  const motionComponents = new Map()

  return {
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
    LayoutGroup: ({ children }) => React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
    motion: new Proxy({}, {
      get: (_, tag) => {
        if (!motionComponents.has(tag)) {
          motionComponents.set(tag, createMotionComponent(tag))
        }
        return motionComponents.get(tag)
      },
    }),
  }
})

function installDefaultMatchMedia() {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: 1280,
  })

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

afterEach(() => {
  vi.useRealTimers()

  if (typeof window === 'undefined') return

  cleanup()
  window.localStorage.clear()
  window.sessionStorage.clear()
  installDefaultMatchMedia()
})

beforeAll(() => {
  if (typeof window === 'undefined') return

  installDefaultMatchMedia()

  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }

  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }

  if (!window.scrollTo) {
    window.scrollTo = vi.fn()
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn()
  }
})
