// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}))

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: null,
    expoGoConfig: null,
  },
}))

const {
  resolveAuthenticatedAvatarUri,
  resolveAvatarCachePath,
  shouldFetchAuthenticatedAvatar,
} = await import('../../../../mobile/src/components/authenticatedAvatarSource.js')

describe('mobile authenticated avatar source', () => {
  it('marks backend avatar paths as authenticated resources', () => {
    expect(shouldFetchAuthenticatedAvatar('/api/avatars/users/user-1?v=1')).toBe(true)
    expect(shouldFetchAuthenticatedAvatar('https://example.com/avatar.png')).toBe(false)
  })

  it('resolves backend avatar paths against the mobile api base url', () => {
    expect(resolveAuthenticatedAvatarUri('/api/avatars/users/user-1?v=1')).toBe('http://localhost:8080/api/avatars/users/user-1?v=1')
    expect(resolveAuthenticatedAvatarUri('https://example.com/avatar.png')).toBe('https://example.com/avatar.png')
  })

  it('builds a stable cached file path for native avatar downloads', () => {
    expect(resolveAvatarCachePath('file:///cache', '/api/avatars/users/user-1?v=1')).toMatch(/^file:\/\/\/cache\/avatars\/avatar-[a-z0-9]+\.img$/)
    expect(resolveAvatarCachePath('file:///cache/', 'https://example.com/avatar.png')).toMatch(/^file:\/\/\/cache\/avatars\/avatar-[a-z0-9]+\.png$/)
  })
})
