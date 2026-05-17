import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MemberAvatarStack from './MemberAvatarStack.jsx'

vi.mock('../../../features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({ accessToken: null }),
}))

const members = [
  {
    id: 'user-1',
    name: 'Arthur Santos',
    email: 'arthur@example.com',
    initials: 'AS',
    color: '#000000',
  },
  {
    id: 'user-2',
    name: 'Bruna Lima',
    email: 'bruna@example.com',
    initials: 'BL',
    color: '#4290da',
  },
]

describe('MemberAvatarStack', () => {
  it('renders skeletons instead of member avatars while loading', () => {
    render(
      <MemberAvatarStack
        members={members}
        isLoading
        placeholderCount={2}
      />,
    )

    expect(screen.getAllByTestId('member-avatar-skeleton')).toHaveLength(2)
    expect(screen.queryByTitle('Arthur Santos')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Bruna Lima')).not.toBeInTheDocument()
  })

  it('renders member avatars after loading finishes', () => {
    render(<MemberAvatarStack members={members} />)

    expect(screen.queryByTestId('member-avatar-skeleton')).not.toBeInTheDocument()
    expect(screen.getByTitle('Arthur Santos')).toBeInTheDocument()
    expect(screen.getByTitle('Bruna Lima')).toBeInTheDocument()
  })
})
