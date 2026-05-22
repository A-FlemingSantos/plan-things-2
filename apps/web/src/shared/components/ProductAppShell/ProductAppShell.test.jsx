import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProductAppShell from './ProductAppShell.jsx'

const styles = {
  shell: 'shell',
}

describe('ProductAppShell', () => {
  it('renders full-width product content without sidebar chrome', () => {
    render(
      <ProductAppShell styles={styles} contentClassName="content" contentTag="main">
        <h1>Workspace</h1>
      </ProductAppShell>,
    )

    const shell = screen.getByText('Workspace').closest('[data-app-shell]')
    const content = screen.getByRole('main')

    expect(shell).toHaveClass('shell')
    expect(content).toHaveClass('content')
    expect(content).toHaveStyle({ gridColumn: '1 / -1' })
    expect(document.querySelector('[data-product-sidebar]')).toBeNull()
    expect(document.querySelector('[data-sidebar-collapse-button]')).toBeNull()
  })
})
