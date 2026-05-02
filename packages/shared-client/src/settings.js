export function normalizeSettingsSnapshot(snapshot = {}) {
  return {
    account: snapshot.account ?? {},
    preferences: snapshot.preferences ?? {},
    notifications: snapshot.notifications ?? {},
    integrations: snapshot.integrations ?? { gmail: { connected: false } },
    workspace: snapshot.workspace ?? {},
  }
}
