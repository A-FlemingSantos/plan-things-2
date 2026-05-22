import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BoardHeaderActions from './BoardHeaderActions.jsx'

vi.mock('../../../../shared/components/MemberAvatarStack/MemberAvatarStack.jsx', () => ({
  default: () => <div>Membros</div>,
}))

const icons = {
  Bolt: () => <svg aria-hidden="true" />,
  Star: () => <svg aria-hidden="true" />,
  Users: () => <svg aria-hidden="true" />,
  UserPlus: () => <svg aria-hidden="true" />,
  More: () => <svg aria-hidden="true" />,
}

const styles = {
  boardHeaderActions: 'boardHeaderActions',
  boardHeaderMembersStack: 'boardHeaderMembersStack',
  boardHeaderActionCluster: 'boardHeaderActionCluster',
  boardHeaderCompactIconButton: 'boardHeaderCompactIconButton',
  boardHeaderShareButton: 'boardHeaderShareButton',
  boardHeaderShareIcon: 'boardHeaderShareIcon',
  boardHeaderShareLabel: 'boardHeaderShareLabel',
}

describe('BoardHeaderActions', () => {
  it('renders compact icon actions and keeps the desktop share action', () => {
    render(
      <BoardHeaderActions
        members={[]}
        icons={icons}
        styles={styles}
        onOpenMembers={vi.fn()}
        membersButtonRef={{ current: null }}
        onAutomate={vi.fn()}
        onFavorite={vi.fn()}
        onFilter={vi.fn()}
        onShare={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Integrações' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Favoritar plano' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Membros do plano' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Configurações do quadro' })).toBeInTheDocument()
  })
})
