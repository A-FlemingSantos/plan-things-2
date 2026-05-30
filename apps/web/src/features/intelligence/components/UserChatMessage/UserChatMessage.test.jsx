import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { COMPOSER_CHIP_KIND_CARD } from '../../../../shared/components/ComposerChip/composerChipPresentation.jsx'
import UserChatMessage from './UserChatMessage.jsx'

describe('UserChatMessage', () => {
  it('renders card context chips with data-kind card and icon in sent messages', () => {
    render(
      <div data-theme="dark">
        <UserChatMessage
          text="Revise este card"
          contextSnapshot={{
            imageAttachments: [],
            fileAttachments: [],
            contextChips: [
              {
                id: 'ctx-card-card-1',
                type: 'card-card-1',
                label: 'Login UI',
                kind: COMPOSER_CHIP_KIND_CARD,
              },
            ],
          }}
          bubbleClassName="bubble"
        />
      </div>,
    )

    const chip = screen.getByText('Login UI').closest('[data-kind]')
    expect(chip).toHaveAttribute('data-kind', 'card')
    expect(chip.querySelector('svg rect')).toBeInTheDocument()
    expect(screen.getByText('Revise este card')).toBeInTheDocument()
  })

  it('keeps plan chips without forcing the card icon', () => {
    const PlanDot = () => <span data-testid="plan-dot" />
    render(
      <UserChatMessage
        text="Olá"
        contextSnapshot={{
          imageAttachments: [],
          fileAttachments: [],
          contextChips: [
            {
              id: 'ctx-plan-pl1',
              type: 'plan-pl1',
              label: 'Plano A',
              kind: 'plan',
              ChipIcon: PlanDot,
            },
          ],
        }}
        bubbleClassName="bubble"
      />,
    )

    expect(screen.getByTestId('plan-dot')).toBeInTheDocument()
    expect(screen.getByText('Plano A').closest('[data-kind]')).toHaveAttribute('data-kind', 'plan')
  })
})
