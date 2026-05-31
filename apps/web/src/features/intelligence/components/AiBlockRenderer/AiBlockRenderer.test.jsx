import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AiBlockRenderer from './AiBlockRenderer.jsx'

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('AiBlockRenderer', () => {
  it('renders markdown and proposal blocks in order', () => {
    renderWithRouter(
      <AiBlockRenderer
        blocks={[
          {
            id: 'b1',
            type: 'MARKDOWN',
            position: 0,
            payload: { markdown: '**Olá** mundo' },
          },
          {
            id: 'b2',
            type: 'PLAN_PROPOSAL',
            position: 1,
            title: 'Criar plano',
            payload: {
              preview: {
                title: 'Plano Demo',
                description: 'Descrição curta',
              },
            },
          },
        ]}
      />,
    )

    expect(screen.getByText('Olá')).toBeInTheDocument()
    expect(screen.getByText('mundo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument()
    expect(screen.getByText('Plano Demo')).toBeInTheDocument()
  })

  it('renders plan reference with internal link', () => {
    renderWithRouter(
      <AiBlockRenderer
        blocks={[{
          id: 'b3',
          type: 'PLAN_REFERENCE',
          position: 0,
          title: 'Meu plano',
          href: '/workspace/board/product-launch-q3',
          snapshot: { subtitle: 'Kanban' },
        }]}
      />,
    )

    const link = screen.getByRole('link', { name: /Meu plano/i })
    expect(link).toHaveAttribute('href', '/workspace/board/product-launch-q3')
    expect(screen.getByText('Kanban')).toBeInTheDocument()
  })

  it('renders card reference with query param link', () => {
    renderWithRouter(
      <AiBlockRenderer
        blocks={[{
          id: 'b5',
          type: 'CARD_REFERENCE',
          position: 0,
          title: 'Cartão alvo',
          href: '/workspace/board/plan-1?card=card-9',
        }]}
      />,
    )

    const link = screen.getByRole('link', { name: /Cartão alvo/i })
    expect(link).toHaveAttribute('href', '/workspace/board/plan-1?card=card-9')
  })

  it('simulates proposal approval without calling backend', async () => {
    const user = userEvent.setup()

    renderWithRouter(
      <AiBlockRenderer
        blocks={[{
          id: 'b4',
          type: 'PLAN_PROPOSAL',
          position: 0,
          payload: { preview: { title: 'Proposta X' } },
        }]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Aprovar' }))
    expect(screen.getByText('Aprovada (simulação)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeDisabled()
  })
})
