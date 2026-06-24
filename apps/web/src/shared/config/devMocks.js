/**
 * Gate for hardcoded UI fallback data used during local development and tests.
 * Production builds must never surface mock content to users.
 */
export const ENABLE_DEV_MOCKS =
  import.meta.env.DEV || import.meta.env.MODE === 'test'
