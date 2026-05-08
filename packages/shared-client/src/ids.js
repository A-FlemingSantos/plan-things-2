export function createClientId(prefix = 'id') {
  const randomSuffix = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${randomSuffix}`
}
