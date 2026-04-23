import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CardModal from './CardModal.jsx'

const styles = new Proxy({}, { get: (_, key) => String(key) })
const icons = new Proxy({}, {
  get: (_, key) => () => <span aria-hidden="true">{String(key)}</span>,
})

function buildCard(overrides = {}) {
  return {
    id: 'card-1',
    title: 'Card de teste',
    description: 'Descricao',
    labelId: '',
    memberIds: [],
    dueDate: '',
    comments: [],
    attachments: [],
    kind: 'CARTAO',
    schedule: {
      selectedCalendarDay: 7,
      startEnabled: false,
      startDateValue: '',
      dueEnabled: false,
      dueDateValue: '',
      dueTimeValue: '',
      displayLabel: '',
      preserveDisplayLabel: false,
    },
    ...overrides,
  }
}

describe('CardModal file picker positioning', () => {
  let originalInnerWidth
  let originalInnerHeight
  let rectSpy

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight
    window.innerWidth = 800
    window.innerHeight = 600

    rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect() {
      if (this.getAttribute?.('aria-label') === 'Anexar arquivo') {
        return {
          x: 120,
          y: 236,
          top: 236,
          left: 120,
          right: 588,
          bottom: 496,
          width: 468,
          height: 260,
          toJSON() {},
        }
      }

      if (this.textContent?.includes('Adicionar')) {
        return {
          x: 120,
          y: 500,
          top: 500,
          left: 120,
          right: 240,
          bottom: 540,
          width: 120,
          height: 40,
          toJSON() {},
        }
      }

      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 100,
        bottom: 40,
        width: 100,
        height: 40,
        toJSON() {},
      }
    })
  })

  afterEach(() => {
    rectSpy.mockRestore()
    window.innerWidth = originalInnerWidth
    window.innerHeight = originalInnerHeight
  })

  it('opens the attachment picker above the trigger and keeps it inside the viewport', async () => {
    const user = userEvent.setup()

    render(
      <CardModal
        card={buildCard()}
        colTitle="Backlog"
        onClose={() => {}}
        onUpdate={async () => {}}
        onDelete={async () => {}}
        labels={[]}
        members={[]}
        currentUser={{ id: 'user-1', fullName: 'Arthur Fleming', email: 'arthur@example.com' }}
        calendarDays={[]}
        icons={icons}
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[{ id: 'file-1', name: 'briefing.pdf', size: 1200, modified: 'Agora' }]}
      />
    )

    await user.click(screen.getByRole('button', { name: /adicionar/i }))

    const picker = await screen.findByRole('dialog', { name: 'Anexar arquivo' })

    await waitFor(() => {
      expect(picker).toHaveStyle({ top: '236px', left: '104px' })
    })
  })
})
