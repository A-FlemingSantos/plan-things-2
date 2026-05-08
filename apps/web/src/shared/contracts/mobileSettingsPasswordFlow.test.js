import { describe, expect, it } from 'vitest'
import {
  buildPasswordRequest,
  getPasswordFlowCopy,
  resolvePasswordFlow,
} from '../../../../mobile/src/screens/settingsPasswordFlow.js'

describe('mobile settings password flow', () => {
  it('uses session flags to unlock first local password setup for OAuth accounts before settings snapshot loads', () => {
    const flow = resolvePasswordFlow({
      sessionUser: {
        localPasswordEnabled: false,
        externalIdentityLinked: true,
      },
    })

    expect(flow).toEqual({
      localPasswordEnabled: false,
      externalIdentityLinked: true,
      canSetupPasswordWithoutCurrent: true,
    })
    expect(getPasswordFlowCopy(flow.canSetupPasswordWithoutCurrent)).toMatchObject({
      actionLabel: 'Criar',
      submitLabel: 'Criar senha',
    })
  })

  it('prefers the normal password change flow after the first local password is created', () => {
    const flow = resolvePasswordFlow({
      settingsAccount: {
        localPasswordEnabled: true,
        externalIdentityLinked: true,
      },
      sessionUser: {
        localPasswordEnabled: false,
        externalIdentityLinked: true,
      },
    })

    expect(flow).toEqual({
      localPasswordEnabled: true,
      externalIdentityLinked: true,
      canSetupPasswordWithoutCurrent: false,
    })
    expect(getPasswordFlowCopy(flow.canSetupPasswordWithoutCurrent)).toMatchObject({
      actionLabel: 'Alterar',
      submitLabel: 'Salvar senha',
    })
  })

  it('builds the OAuth password setup request without a current password', () => {
    expect(buildPasswordRequest({
      canSetupPasswordWithoutCurrent: true,
      currentPassword: 'ignored',
      newPassword: 'oauth-local',
    })).toEqual({
      path: '/api/settings/password/setup',
      options: {
        method: 'POST',
        body: { newPassword: 'oauth-local' },
      },
    })
  })

  it('builds the regular password change request with the current password', () => {
    expect(buildPasswordRequest({
      canSetupPasswordWithoutCurrent: false,
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova',
    })).toEqual({
      path: '/api/settings/password',
      options: {
        method: 'PATCH',
        body: {
          currentPassword: 'senha-atual',
          newPassword: 'senha-nova',
        },
      },
    })
  })
})
