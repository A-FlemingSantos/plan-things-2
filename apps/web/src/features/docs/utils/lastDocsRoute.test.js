import { afterEach, describe, expect, it } from 'vitest'
import { ROUTES } from '../../../shared/config/routes.js'
import { rememberDocsRoute, resolveDocsDockPath } from './lastDocsRoute.js'

const LAST_DOCS_ROUTE_KEY = 'plan-things:last-docs-route:v1'
const DOCUMENT_ID = '338352ef-a458-457a-92b7-f21755b2e637'

afterEach(() => {
  window.localStorage.clear()
})

describe('lastDocsRoute', () => {
  it('drops legacy mock document routes instead of restoring them', () => {
    window.localStorage.setItem(LAST_DOCS_ROUTE_KEY, '/docs/spark')

    expect(resolveDocsDockPath()).toBe(ROUTES.docs)
    expect(window.localStorage.getItem(LAST_DOCS_ROUTE_KEY)).toBeNull()
  })

  it('only remembers UUID-backed document routes', () => {
    rememberDocsRoute('/docs/spark')
    expect(resolveDocsDockPath()).toBe(ROUTES.docs)

    rememberDocsRoute(`/docs/${DOCUMENT_ID}`)
    expect(resolveDocsDockPath()).toBe(`/docs/${DOCUMENT_ID}`)
  })
})
