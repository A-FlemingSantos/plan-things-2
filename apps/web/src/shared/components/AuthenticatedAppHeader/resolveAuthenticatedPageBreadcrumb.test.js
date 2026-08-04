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
      workspaceName: 'Área de trabalho pessoal',
      pageTitle: null,
    })
  })

  it('returns the plan name for board routes', () => {
    expect(resolveAuthenticatedPageBreadcrumb({
      pathname: `${ROUTES.workspaceBoard}/plan-1`,
      workspaceName: 'Workspace',
      plans: [{ id: 'plan-1', name: 'Lancamento Q3' }],
    })).toEqual({
      workspaceName: 'Workspace',
      pageTitle: 'Lancamento Q3',
    })
  })

  it('falls back to page labels for other authenticated routes', () => {
    expect(resolveAuthenticatedPageBreadcrumb({
      pathname: ROUTES.settings,
      workspaceName: 'Workspace',
      plans: [],
    })).toEqual({
      workspaceName: 'Workspace',
      pageTitle: 'Configurações',
    })
  })
})
