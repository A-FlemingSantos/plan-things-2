import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthenticatedAvatar from './AuthenticatedAvatar.jsx'

const apiMock = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}))

const authState = vi.hoisted(() => ({
  current: {
    accessToken: 'token-1',
  },
}))

vi.mock('../../../features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => authState.current,
}))

vi.mock('../../api/apiClient.js', () => ({
  apiRequest: apiMock.apiRequest,
}))

describe('AuthenticatedAvatar', () => {
  beforeEach(() => {
    apiMock.apiRequest.mockReset()
    authState.current = {
      accessToken: 'token-1',
    }
    window.URL.createObjectURL = vi.fn(() => 'blob:avatar')
  })

  it('renders the fallback immediately when there is no avatar URL', () => {
    render(
      <AuthenticatedAvatar
        avatarUrl={null}
        fallback="AS"
        title="Arthur Santos"
        alt="Arthur Santos"
      />,
    )

    expect(screen.getByText('AS')).toBeInTheDocument()
    expect(screen.queryByTestId('authenticated-avatar-skeleton')).not.toBeInTheDocument()
    expect(apiMock.apiRequest).not.toHaveBeenCalled()
  })

  it('keeps a skeleton visible until an authenticated avatar image loads', async () => {
    apiMock.apiRequest.mockResolvedValueOnce(new Blob(['avatar']))

    render(
      <AuthenticatedAvatar
        avatarUrl="/api/avatars/users/user-1"
        fallback="AS"
        title="Arthur Santos"
        alt="Arthur Santos"
      />,
    )

    expect(screen.getByTestId('authenticated-avatar-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('AS')).not.toBeInTheDocument()

    const image = await screen.findByAltText('Arthur Santos')
    expect(image).toHaveStyle({ display: 'none' })
    expect(screen.getByTestId('authenticated-avatar-skeleton')).toBeInTheDocument()

    fireEvent.load(image)

    await waitFor(() => {
      expect(screen.queryByTestId('authenticated-avatar-skeleton')).not.toBeInTheDocument()
    })
    expect(image).not.toHaveStyle({ display: 'none' })
  })

  it('falls back to initials when an authenticated avatar cannot be resolved', async () => {
    apiMock.apiRequest.mockRejectedValueOnce(new Error('avatar unavailable'))

    render(
      <AuthenticatedAvatar
        avatarUrl="/api/avatars/users/user-2"
        fallback="BL"
        title="Bruna Lima"
        alt="Bruna Lima"
      />,
    )

    expect(screen.getByTestId('authenticated-avatar-skeleton')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('BL')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('authenticated-avatar-skeleton')).not.toBeInTheDocument()
  })
})
