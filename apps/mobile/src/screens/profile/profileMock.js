export const profileBannerTheme = {
  id: 'studio',
  color: '#20232a',
  shades: ['#0d0e12', '#3c4353', '#8fa3c7'],
}

export function getMockRole(session) {
  const workspaceName = session?.workspace?.name ?? 'Workspace'
  return `Product Designer · ${workspaceName}`
}
