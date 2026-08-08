import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LoadingScreen from '../components/Loader/LoadingScreen.jsx'
import { AppChromeProvider, useAppChrome } from './AppChromeContext.jsx'

function BreadcrumbProbe() {
  const { pageBreadcrumbLabel, setPageBreadcrumbLabel } = useAppChrome()

  return (
    <>
      <span data-testid="breadcrumb-label">{pageBreadcrumbLabel ?? ''}</span>
      <button type="button" onClick={() => setPageBreadcrumbLabel('Spark Creativity')}>
        Set label
      </button>
    </>
  )
}

describe('AppChromeContext', () => {
  it('tracks page breadcrumb labels', () => {
    render(
      <AppChromeProvider>
        <BreadcrumbProbe />
      </AppChromeProvider>,
    )

    expect(screen.getByTestId('breadcrumb-label')).toHaveTextContent('')
    fireEvent.click(screen.getByRole('button', { name: 'Set label' }))
    expect(screen.getByTestId('breadcrumb-label')).toHaveTextContent('Spark Creativity')
  })

  it('tracks only fullscreen loading screens', () => {
    function LoadingProbe() {
      const { isLoadingScreenActive } = useAppChrome()

      return <span data-testid="loading-active">{String(isLoadingScreenActive)}</span>
    }

    const { rerender } = render(
      <AppChromeProvider>
        <LoadingProbe />
        <LoadingScreen label="Carregando planos" />
      </AppChromeProvider>,
    )

    expect(screen.getByTestId('loading-active')).toHaveTextContent('false')

    rerender(
      <AppChromeProvider>
        <LoadingProbe />
        <LoadingScreen variant="fullscreen" label="Carregando sessão" />
      </AppChromeProvider>,
    )

    expect(screen.getByTestId('loading-active')).toHaveTextContent('true')

    rerender(
      <AppChromeProvider>
        <LoadingProbe />
      </AppChromeProvider>,
    )

    expect(screen.getByTestId('loading-active')).toHaveTextContent('false')
  })
})
