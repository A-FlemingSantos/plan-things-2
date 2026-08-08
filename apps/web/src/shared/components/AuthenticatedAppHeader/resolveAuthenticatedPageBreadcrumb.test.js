import { describe, expect, it } from 'vitest'
import { ROUTES } from '../../config/routes.js'
import { resolveAuthenticatedPageBreadcrumb } from './resolveAuthenticatedPageBreadcrumb.js'

describe('resolveAuthenticatedPageBreadcrumb', () => {
  it('returns only the workspace name on the workspace home route', () => {
    expect(resolveAuthenticatedPageBreadcrumb({
      pathname: ROUTES.workspace,
      workspaceName: 'Área de trabalho pessoal',
      plans: [],
    })).toEqual({
      items: [
        { label: 'Área de trabalho pessoal', to: null, current: true },
      ],
    })
  })

  it('returns navigable segments for board routes', () => {
    expect(resolveAuthenticatedPageBreadcrumb({
      pathname: `${ROUTES.workspaceBoard}/plan-1`,
      workspaceName: 'Workspace',
      plans: [{ id: 'plan-1', name: 'Lancamento Q3' }],
    })).toEqual({
      items: [
        { label: 'Workspace', to: ROUTES.workspace, current: false },
        { label: 'Lancamento Q3', to: null, current: true },
      ],
    })
  })

  it('falls back to page labels for other authenticated routes', () => {
    expect(resolveAuthenticatedPageBreadcrumb({
      pathname: ROUTES.settings,
      workspaceName: 'Workspace',
      plans: [],
    })).toEqual({
      items: [
        { label: 'Workspace', to: ROUTES.workspace, current: false },
        { label: 'Configurações', to: null, current: true },
      ],
    })
  })

  it('returns Docs label for the knowledge route', () => {
    expect(resolveAuthenticatedPageBreadcrumb({
      pathname: ROUTES.docs,
      workspaceName: 'Workspace',
      plans: [],
    })).toEqual({
      items: [
        { label: 'Workspace', to: ROUTES.workspace, current: false },
        { label: 'Docs', to: null, current: true },
      ],
    })
  })

  it('uses the provided document title for a document route', () => {
    expect(resolveAuthenticatedPageBreadcrumb({
      pathname: `${ROUTES.docs}/spark`,
      workspaceName: 'Workspace',
      plans: [],
      documentTitle: 'Spark Creativity',
    })).toEqual({
      items: [
        { label: 'Workspace', to: ROUTES.workspace, current: false },
        { label: 'Docs', to: ROUTES.docs, current: false },
        { label: 'Spark Creativity', to: null, current: true },
      ],
    })
  })

  it('returns navigable Docs segments for a document route', () => {
    expect(resolveAuthenticatedPageBreadcrumb({
      pathname: `${ROUTES.docs}/spark`,
      workspaceName: 'Workspace',
      plans: [],
    })).toEqual({
      items: [
        { label: 'Workspace', to: ROUTES.workspace, current: false },
        { label: 'Docs', to: ROUTES.docs, current: false },
        { label: 'Documento', to: null, current: true },
      ],
    })
  })

  it('returns Nova doc label for the blank docs composer', () => {
    expect(resolveAuthenticatedPageBreadcrumb({
      pathname: ROUTES.docsNew,
      workspaceName: 'Workspace',
      plans: [],
    })).toEqual({
      items: [
        { label: 'Workspace', to: ROUTES.workspace, current: false },
        { label: 'Docs', to: ROUTES.docs, current: false },
        { label: 'Nova doc', to: null, current: true },
      ],
    })
  })
})
