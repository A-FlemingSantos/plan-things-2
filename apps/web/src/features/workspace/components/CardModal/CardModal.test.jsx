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

async function openSidebarPanel(user, panelLabel = 'Atividade') {
  await user.click(screen.getByRole('button', { name: `Painel ${panelLabel}` }))
}

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
    window.localStorage.clear()
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight
    window.innerWidth = 800
    window.innerHeight = 600

    rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect() {
      if (this.getAttribute?.('aria-label') === 'Aplicativos') {
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
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[{ id: 'file-1', name: 'briefing.pdf', size: 1200, modified: 'Agora' }]}
      />
    )

    await openSidebarPanel(user)
    await user.click(screen.getByLabelText('Aplicativos'))
    await user.click(screen.getByRole('button', { name: /Anexe um arquivo/i }))

    const picker = await screen.findByRole('dialog', { name: 'Anexar arquivo' })

    await waitFor(() => {
      expect(picker).toHaveStyle({ top: '236px', left: '104px' })
    })
  })

  it('shows recent activity messages in the compact preview', () => {
    render(
      <CardModal
        card={buildCard({
          comments: [
            {
              id: 'comment-1',
              authorId: 'user-1',
              authorName: 'Arthur Fleming',
              kind: 'USER_COMMENT',
              text: 'Primeira mensagem',
              time: 'Ontem',
            },
            {
              id: 'comment-2',
              authorId: 'user-2',
              authorName: 'Beatriz Souza',
              kind: 'USER_COMMENT',
              text: 'Segunda mensagem',
              time: 'Hoje',
            },
            {
              id: 'comment-3',
              authorId: 'user-1',
              authorName: 'Arthur Fleming',
              kind: 'USER_COMMENT',
              text: 'Terceira mensagem',
              time: 'Agora',
            },
            {
              id: 'comment-4',
              authorId: 'user-2',
              authorName: 'Beatriz Souza',
              kind: 'USER_COMMENT',
              text: 'Ultima mensagem',
              time: 'Agora',
            },
          ],
        })}
        colTitle="Backlog"
        onClose={() => {}}
        onUpdate={async () => {}}
        onDelete={async () => {}}
        labels={[]}
        members={[
          { id: 'user-1', name: 'Arthur Fleming', initials: 'AF', color: '#4290da', email: 'arthur@example.com' },
          { id: 'user-2', name: 'Beatriz Souza', initials: 'BS', color: '#ff6766', email: 'beatriz@example.com' },
        ]}
        currentUser={{ id: 'user-1', fullName: 'Arthur Fleming', email: 'arthur@example.com' }}
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    expect(screen.getByLabelText('Recentes')).toBeInTheDocument()
    expect(screen.getByText('Ultima mensagem')).toBeInTheDocument()
    expect(screen.queryByText('Primeira mensagem')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver mais activity' })).toBeInTheDocument()
  })

  it('expands the compact activity preview when clicking Ver mais', async () => {
    const user = userEvent.setup()

    render(
      <CardModal
        card={buildCard({
          comments: [
            {
              id: 'comment-1',
              authorId: 'user-1',
              authorName: 'Arthur Fleming',
              kind: 'USER_COMMENT',
              text: 'Primeira mensagem',
              time: 'Ontem',
            },
            {
              id: 'comment-2',
              authorId: 'user-2',
              authorName: 'Beatriz Souza',
              kind: 'USER_COMMENT',
              text: 'Segunda mensagem',
              time: 'Hoje',
            },
            {
              id: 'comment-3',
              authorId: 'user-1',
              authorName: 'Arthur Fleming',
              kind: 'USER_COMMENT',
              text: 'Terceira mensagem',
              time: 'Agora',
            },
            {
              id: 'comment-4',
              authorId: 'user-2',
              authorName: 'Beatriz Souza',
              kind: 'USER_COMMENT',
              text: 'Quarta mensagem',
              time: 'Agora',
            },
          ],
        })}
        colTitle="Backlog"
        onClose={() => {}}
        onUpdate={async () => {}}
        onDelete={async () => {}}
        labels={[]}
        members={[
          { id: 'user-1', name: 'Arthur Fleming', initials: 'AF', color: '#4290da', email: 'arthur@example.com' },
          { id: 'user-2', name: 'Beatriz Souza', initials: 'BS', color: '#ff6766', email: 'beatriz@example.com' },
        ]}
        currentUser={{ id: 'user-1', fullName: 'Arthur Fleming', email: 'arthur@example.com' }}
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    expect(screen.queryByText('Primeira mensagem')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver mais activity' }))

    expect(screen.getByText('Primeira mensagem')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recolher activity' })).toBeInTheDocument()
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
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    await openSidebarPanel(user)

    const commentField = await screen.findByLabelText('Escrever comentário')
    expect(screen.getByRole('button', { name: 'Enviar comentário' })).toBeInTheDocument()
    expect(screen.getByLabelText('Anexar ao comentário')).toBeInTheDocument()

    await user.type(commentField, 'Ola!')
    await user.click(screen.getByRole('button', { name: 'Enviar comentário' }))

    await waitFor(() => {
      expect(addComment).toHaveBeenCalledWith('card-1', 'Ola!')
    })
  })

  it('keeps the initial assignment history stable when the card props refresh', async () => {
    const user = userEvent.setup()
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

    await openSidebarPanel(user)
    const findAssignmentHistoryItems = () => Array.from(document.querySelectorAll('p'))
      .filter((item) => item.textContent?.includes('atribuiu a:'))

    expect(findAssignmentHistoryItems().some((item) => item.textContent?.includes('Arthur Fleming'))).toBe(true)

    rerender(
      <CardModal
        card={{
          ...baseCard,
          memberIds: ['member-2'],
        }}
        {...sharedProps}
      />
    )

    expect(findAssignmentHistoryItems().some((item) => item.textContent?.includes('Arthur Fleming'))).toBe(true)
    expect(findAssignmentHistoryItems().some((item) => item.textContent?.includes('Beatriz Souza'))).toBe(false)
  })

  it('renders persisted assignee activity as inline history instead of a comment card', async () => {
    const user = userEvent.setup()
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
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    await openSidebarPanel(user)

    expect(screen.getByText(/removeu os responsaveis/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Responder' })).not.toBeInTheDocument()
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

    await openSidebarPanel(user, 'Lista')

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

  it('does not expose checklist creation when the card already has one', async () => {
    const user = userEvent.setup()
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

    await openSidebarPanel(user, 'Lista')

    expect(screen.queryByRole('button', { name: /criar checklist/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeEnabled()
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
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    expect(screen.getByRole('button', { name: 'Expandir painel lateral' })).toHaveAttribute('aria-expanded', 'false')

    await user.click(screen.getByRole('button', { name: 'Expandir painel lateral' }))

    expect(screen.getByRole('button', { name: 'Recolher painel lateral' })).toHaveAttribute('aria-expanded', 'true')
    expect(window.localStorage.getItem('plan-things:card-modal-activity-sidebar-open:v1:user-1')).toBe('true')
  })

  it('shows the sidebar picker on first open before a panel is selected', async () => {
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
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Expandir painel lateral' }))

    expect(screen.getByRole('group', { name: 'Painéis laterais' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Atividade' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Arquivos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lista' })).toBeInTheDocument()
  })

  it('persists the selected sidebar panel in localStorage', async () => {
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
        styles={styles}
        isBackendDriven
        planFiles={[]}
        libraryFiles={[]}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Expandir painel lateral' }))
    await user.click(screen.getByRole('button', { name: 'Painel Atividade' }))

    expect(window.localStorage.getItem('plan-things:card-modal-sidebar-panel:v1:user-1')).toBe('activity')
    expect(screen.getByRole('button', { name: 'Voltar às opções' })).toBeInTheDocument()
  })
})
