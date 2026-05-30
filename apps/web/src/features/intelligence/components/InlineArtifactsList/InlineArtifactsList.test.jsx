import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import InlineArtifactsList from './InlineArtifactsList.jsx'

describe('InlineArtifactsList', () => {
  it('renders collapsed summary and toggles detailed content on click', async () => {
    const user = userEvent.setup()

    render(
      <InlineArtifactsList
        items={[{
          id: 'inline-1',
          type: 'TOOL_STATUS',
          position: 0,
          label: 'workspace.get_summary',
          status: 'completed',
          detail: 'Resumo do workspace carregado (mock).',
          payload: {
            title: 'Ferramenta: workspace.get_summary',
            note: 'Simulação — nenhuma ferramenta foi executada no servidor.',
          },
        }]}
      />,
    )

    const trigger = screen.getByRole('button', { name: /Ferramenta/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Resumo do workspace carregado (mock).')).not.toBeInTheDocument()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Resumo do workspace carregado (mock).')).toBeInTheDocument()
    expect(screen.getByText('Simulação — nenhuma ferramenta foi executada no servidor.')).toBeInTheDocument()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Resumo do workspace carregado (mock).')).not.toBeInTheDocument()
  })
})
