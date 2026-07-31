/**
 * Shared contracts for the Plan GitHub integration modal (multi-repo
 * search, connect/remove, connection state and manager-permission gating).
 * This is the plan-level counterpart to the CardModal GitHub panel: it
 * manages *which repos* are connected to the plan, not individual linked
 * objects.
 */

/**
 * @typedef {Object} GitHubRepoOption
 * Result row coming from a repo search against the connected GitHub account.
 * @property {string} id
 * @property {string} fullName - e.g. "org/repo".
 * @property {string} [description]
 * @property {boolean} [isPrivate]
 * @property {string} [ownerAvatarUrl]
 * @property {string} [defaultBranch]
 */

/**
 * @typedef {Object} ConnectedGitHubRepo
 * A repo already connected to the plan.
 * @property {string} id
 * @property {string} fullName - e.g. "org/repo".
 * @property {string} [ownerAvatarUrl]
 * @property {boolean} [isPrivate]
 * @property {'connected'|'error'} connectionStatus
 * @property {string} [errorMessage] - populated when connectionStatus === 'error'.
 * @property {string} [connectedAt] - ISO 8601 timestamp.
 * @property {string} [connectedByName]
 */

export const PLAN_GITHUB_MODAL_STATUS = {
  LOADING: 'loading',
  DISCONNECTED: 'disconnected',
  PERMISSION_DENIED: 'permission_denied',
  ERROR: 'error',
  READY: 'ready',
}
