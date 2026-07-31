import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import BoardHeader from './BoardHeader.jsx'

describe('BoardHeader GitHub integration', () => {
  it('opens the plan GitHub modal from the Blocks action', async () => {
    const user = userEvent.setup()
    render(
      <BoardHeader
        planName="MVP GitHub"
        githubIntegration={{
          status: 'ready',
          isManager: true,
          connectedRepos: [],
        }}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Integrações do GitHub' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: 'Integrações do GitHub do plano' })).toBeInTheDocument()
    expect(screen.getAllByText('MVP GitHub')).toHaveLength(2)
  })
})
