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
})
