export function resolvePasswordFlow({ settingsAccount, sessionUser } = {}) {
  const localPasswordEnabled = settingsAccount?.localPasswordEnabled ?? sessionUser?.localPasswordEnabled ?? true
  const externalIdentityLinked = settingsAccount?.externalIdentityLinked ?? sessionUser?.externalIdentityLinked ?? false
  const canSetupPasswordWithoutCurrent = externalIdentityLinked && !localPasswordEnabled

  return {
    localPasswordEnabled,
    externalIdentityLinked,
    canSetupPasswordWithoutCurrent,
  }
}

export function getPasswordFlowCopy(canSetupPasswordWithoutCurrent) {
  if (canSetupPasswordWithoutCurrent) {
    return {
      actionLabel: 'Criar',
      rowHint: 'Crie uma senha local para entrar também sem OAuth.',
      sheetTitle: 'Criar senha',
      sheetDescription: 'Sua conta usa OAuth. Você pode criar uma senha local sem informar a senha atual.',
      submitLabel: 'Criar senha',
    }
  }

  return {
    actionLabel: 'Alterar',
    rowHint: 'Atualize sua senha para manter a conta protegida.',
    sheetTitle: 'Alterar senha',
    sheetDescription: null,
    submitLabel: 'Salvar senha',
  }
}

export function buildPasswordRequest({ canSetupPasswordWithoutCurrent, currentPassword, newPassword }) {
  if (canSetupPasswordWithoutCurrent) {
    return {
      path: '/api/settings/password/setup',
      options: {
        method: 'POST',
        body: { newPassword },
      },
    }
  }

  return {
    path: '/api/settings/password',
    options: {
      method: 'PATCH',
      body: {
        currentPassword,
        newPassword,
      },
    },
  }
}
