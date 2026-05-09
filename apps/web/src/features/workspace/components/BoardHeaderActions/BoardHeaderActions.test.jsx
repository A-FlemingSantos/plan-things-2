import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BoardHeaderActions from './BoardHeaderActions.jsx'

vi.mock('../../../../shared/components/MemberAvatarStack/MemberAvatarStack.jsx', () => ({
  default: () => <div>Membros</div>,
}))

const icons = {
  Plus: () => <svg aria-hidden="true" />,
  Users: () => <svg aria-hidden="true" />,
  Filter: () => <svg aria-hidden="true" />,
  Share: () => <svg aria-hidden="true" />,
}

const styles = {
  boardHeaderActions: 'boardHeaderActions',
  boardHeaderIdentityRow: 'boardHeaderIdentityRow',
  boardHeaderUtilityGroup: 'boardHeaderUtilityGroup',
  boardHeaderUtilitySlot: 'boardHeaderUtilitySlot',
  boardHeaderIconBtn: 'boardHeaderIconBtn',
  boardHeaderCommandRow: 'boardHeaderCommandRow',
  boardHeaderBtn: 'boardHeaderBtn',
  boardHeaderBtnPrimary: 'boardHeaderBtnPrimary',
}

describe('BoardHeaderActions', () => {
  it('renders compact icon actions alongside notifications and keeps desktop text actions', () => {
    render(
      <BoardHeaderActions
        members={[]}
        icons={icons}
        styles={styles}
        onAddMember={vi.fn()}
        onOpenMembers={vi.fn()}
        membersButtonRef={{ current: null }}
        onFilter={vi.fn()}
        onShare={vi.fn()}
        notifications={<button type="button">Notificações</button>}
      />,
    )

    expect(screen.getByRole('button', { name: 'Notificações' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Filtrar' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Compartilhar' })).toHaveLength(2)
  })
})
