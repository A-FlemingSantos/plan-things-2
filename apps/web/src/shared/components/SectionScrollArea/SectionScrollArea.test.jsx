import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SectionScrollArea from './SectionScrollArea.jsx'

describe('SectionScrollArea', () => {
  it('registers scroll sections inside the viewport', () => {
    render(
      <SectionScrollArea refreshKey="test">
        <SectionScrollArea.Section id="overview" label="Visão geral">
          <div>Overview</div>
        </SectionScrollArea.Section>
        <SectionScrollArea.Section id="description" label="Descrição">
          <div>Description</div>
        </SectionScrollArea.Section>
      </SectionScrollArea>,
    )

    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(document.querySelector('[data-section-id="overview"]')).toBeInTheDocument()
    expect(document.querySelector('[data-section-id="description"]')).toBeInTheDocument()
  })
})
