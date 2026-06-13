import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CardModal from './CardModal.jsx'

vi.mock('../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx', () => ({
  default: ({ fallback = 'PT', title = '' }) => (
    <span aria-label={title || fallback}>
      {fallback}
    </span>
  ),
}))

const styles = new Proxy({}, { get: (_, key) => String(key) })

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
    checklists: [],
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

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
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

      if (this.getAttribute?.('aria-label') === 'Adicionar anexo' || this.textContent?.includes('Anexar arquivo')) {
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
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[{ id: 'file-1', name: 'briefing.pdf', size: 1200, modified: 'Agora' }]}
      />
    )

    await user.click(screen.getByRole('button', { name: /adicionar anexo/i }))
    await user.click(screen.getByRole('menuitem', { name: /biblioteca/i }))

    const picker = await screen.findByRole('dialog', { name: 'Anexar arquivo' })

    await waitFor(() => {
      expect(picker).toHaveStyle({ top: '236px', left: '104px' })
    })
  })

  it('creates a checklist through backend handlers', async () => {
    const user = userEvent.setup()
    const createChecklist = vi.fn().mockResolvedValue({
      id: 'checklist-1',
      title: 'Entrega',
      items: [],
    })

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
        styles={styles}
        isBackendDriven
        onCreateChecklist={createChecklist}
        onCreateChecklistItem={async () => {}}
        onUpdateChecklistItem={async () => {}}
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    await user.click(screen.getByRole('button', { name: /checklist/i }))

    const titleInput = screen.getByLabelText('Título do checklist')
    await user.clear(titleInput)
    await user.type(titleInput, 'Entrega')

    const dialogs = screen.getAllByRole('dialog')
    const checklistDialog = dialogs[dialogs.length - 1]
    await user.click(within(checklistDialog).getByRole('button', { name: /^Adicionar$/i }))

    await waitFor(() => {
      expect(createChecklist).toHaveBeenCalledWith('card-1', 'Entrega')
    })
  })

  it('opens the comment editor actions on focus and saves the comment through the footer button', async () => {
    const user = userEvent.setup()
    const deferred = createDeferred()
    const addComment = vi.fn(() => deferred.promise)

    render(
      <CardModal
        card={buildCard()}
        colTitle="Backlog"
        onClose={() => {}}
        onUpdate={async () => {}}
        onDelete={async () => {}}
        onAddComment={addComment}
        labels={[]}
        members={[]}
        currentUser={{ id: 'user-1', fullName: 'Arthur Fleming', email: 'arthur@example.com' }}
        calendarDays={[]}
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    const commentField = screen.getByLabelText('Escrever comentário')
    expect(screen.getByRole('button', { name: 'Enviar comentário' })).toBeInTheDocument()
    expect(screen.getByLabelText('Anexar ao comentário')).toBeInTheDocument()

    await user.type(commentField, 'Ola!')
    await user.click(screen.getByRole('button', { name: 'Enviar comentário' }))

    await waitFor(() => {
      expect(addComment).toHaveBeenCalledWith('card-1', 'Ola!')
    })
  })

  it('keeps the initial assignment history stable when the card props refresh', () => {
    const baseCard = buildCard({
      memberIds: ['member-1'],
      createdAt: {
        iso: '2026-06-07T20:00:00-03:00',
        text: '07/06/2026 20:00',
      },
    })

    const sharedProps = {
      colTitle: 'Backlog',
      onClose: () => {},
      onUpdate: async () => {},
      onDelete: async () => {},
      labels: [],
      members: [
        { id: 'member-1', name: 'Arthur Fleming', initials: 'AF', color: '#4290da', email: 'arthur@example.com' },
        { id: 'member-2', name: 'Beatriz Souza', initials: 'BS', color: '#ff6766', email: 'beatriz@example.com' },
      ],
      currentUser: { id: 'user-1', fullName: 'Arthur Fleming', email: 'arthur@example.com' },
      calendarDays: [],
      styles,
      isBackendDriven: true,
      planFiles: [],
      libraryFiles: [],
    }

    const { rerender } = render(
      <CardModal
        card={baseCard}
        {...sharedProps}
      />
    )

    expect(screen.getByText(/atribuiu a: Arthur Fleming/i)).toBeInTheDocument()

    rerender(
      <CardModal
        card={{
          ...baseCard,
          memberIds: ['member-2'],
        }}
        {...sharedProps}
      />
    )

    expect(screen.getByText(/atribuiu a: Arthur Fleming/i)).toBeInTheDocument()
    expect(screen.queryByText(/atribuiu a: Beatriz Souza/i)).not.toBeInTheDocument()
  })

  it('renders persisted assignee activity as inline history instead of a comment card', () => {
    render(
      <CardModal
        card={buildCard({
          comments: [
            {
              id: 'activity-1',
              authorId: 'user-1',
              authorName: 'Arthur Fleming',
              kind: 'ASSIGNEE_ACTIVITY',
              text: 'removeu os responsaveis',
              time: '07/06/2026 22:00',
              createdAtIso: '2026-06-07T22:00:00-03:00',
            },
          ],
        })}
        colTitle="Backlog"
        onClose={() => {}}
        onUpdate={async () => {}}
        onDelete={async () => {}}
        labels={[]}
        members={[]}
        currentUser={{ id: 'user-1', fullName: 'Arthur Fleming', email: 'arthur@example.com' }}
        calendarDays={[]}
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    expect(screen.getByText(/removeu os responsaveis/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Responder' })).not.toBeInTheDocument()
  })

  it('shows a new checklist immediately while the backend request is still pending', async () => {
    const user = userEvent.setup()
    const deferred = createDeferred()
    const createChecklist = vi.fn(() => deferred.promise)

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
        styles={styles}
        isBackendDriven
        onCreateChecklist={createChecklist}
        onCreateChecklistItem={async () => {}}
        onUpdateChecklistItem={async () => {}}
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    await user.click(screen.getByRole('button', { name: /checklist/i }))
    await user.clear(screen.getByLabelText('Título do checklist'))
    await user.type(screen.getByLabelText('Título do checklist'), 'Entrega')

    const dialogs = screen.getAllByRole('dialog')
    const checklistDialog = dialogs[dialogs.length - 1]
    await user.click(within(checklistDialog).getByRole('button', { name: /^Adicionar$/i }))

    expect(screen.getByText('Entrega')).toBeInTheDocument()

    deferred.resolve({
      id: 'checklist-1',
      title: 'Entrega',
      items: [],
    })

    await waitFor(() => {
      expect(createChecklist).toHaveBeenCalledWith('card-1', 'Entrega')
    })
  })

  it('reverts checklist item toggles when the backend update fails', async () => {
    const user = userEvent.setup()
    const deferred = createDeferred()
    const updateChecklistItem = vi.fn(() => deferred.promise)

    render(
      <CardModal
        card={buildCard({
          checklists: [
            {
              id: 'checklist-1',
              title: 'Entrega',
              items: [
                {
                  id: 'item-1',
                  title: 'Enviar briefing',
                  completed: false,
                },
              ],
            },
          ],
        })}
        colTitle="Backlog"
        onClose={() => {}}
        onUpdate={async () => {}}
        onDelete={async () => {}}
        labels={[]}
        members={[]}
        currentUser={{ id: 'user-1', fullName: 'Arthur Fleming', email: 'arthur@example.com' }}
        calendarDays={[]}
        styles={styles}
        isBackendDriven
        onCreateChecklist={async () => {}}
        onDeleteChecklist={async () => {}}
        onCreateChecklistItem={async () => {}}
        onUpdateChecklistItem={updateChecklistItem}
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    const itemRow = screen.getByText('Enviar briefing').closest('label')
    const toggleButton = within(itemRow).getByRole('button')

    await user.click(toggleButton)

    expect(screen.getByText('Enviar briefing')).toHaveClass('cmChecklistItemTextChecked')

    await waitFor(() => {
      expect(updateChecklistItem).toHaveBeenCalledWith(expect.objectContaining({
        id: 'item-1',
        completed: true,
      }))
    })

    deferred.reject(new Error('Falha ao atualizar item'))

    await waitFor(() => {
      expect(screen.getByText('Enviar briefing')).not.toHaveClass('cmChecklistItemTextChecked')
    })
    expect(screen.getByText('Falha ao atualizar item')).toBeInTheDocument()
  })

  it('disables checklist creation when the card already has one', () => {
    const deleteChecklist = vi.fn()

    render(
      <CardModal
        card={buildCard({
          checklists: [
            {
              id: 'checklist-1',
              title: 'Entrega',
              items: [],
            },
          ],
        })}
        colTitle="Backlog"
        onClose={() => {}}
        onUpdate={async () => {}}
        onDelete={async () => {}}
        labels={[]}
        members={[]}
        currentUser={{ id: 'user-1', fullName: 'Arthur Fleming', email: 'arthur@example.com' }}
        calendarDays={[]}
        styles={styles}
        isBackendDriven
        onCreateChecklist={async () => {}}
        onDeleteChecklist={deleteChecklist}
        onCreateChecklistItem={async () => {}}
        onUpdateChecklistItem={async () => {}}
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    expect(screen.getByRole('button', { name: /checklist/i })).toBeDisabled()
    const deleteButtons = screen.getAllByRole('button', { name: /excluir/i })
    expect(deleteButtons[deleteButtons.length - 1]).toBeEnabled()
  })

  it('filters legacy member ids that no longer belong to the plan before saving another change', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn(async (nextCard) => nextCard)

    render(
      <CardModal
        card={buildCard({
          labelId: 'label-legacy',
          memberIds: ['member-legacy'],
        })}
        colTitle="Backlog"
        onClose={() => {}}
        onUpdate={onUpdate}
        onDelete={async () => {}}
        labels={[
          { id: 'label-legacy', text: 'Antiga', color: '#999999' },
          { id: 'label-1', text: 'Urgente', color: '#ff6766' },
        ]}
        members={[
          { id: 'member-1', name: 'Membro atual', email: 'member@example.com', color: '#4290da' },
        ]}
        currentUser={{ id: 'user-1', fullName: 'Arthur Fleming', email: 'arthur@example.com' }}
        calendarDays={[]}
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    await user.click(screen.getByRole('button', { name: /antiga/i }))
    await user.click(screen.getByRole('button', { name: /urgente/i }))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
        labelId: 'label-1',
        memberIds: [],
      }))
    })
  })

  it('persists the Activity sidebar open state in localStorage', async () => {
    const user = userEvent.setup()
    window.localStorage.clear()

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
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    expect(screen.getByRole('button', { name: 'Recolher Activity' })).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('button', { name: 'Recolher Activity' }))

    expect(screen.getByRole('button', { name: 'Expandir Activity' })).toHaveAttribute('aria-expanded', 'false')
    expect(window.localStorage.getItem('plan-things:card-modal-activity-sidebar-open:v1:user-1')).toBe('false')
  })
})
