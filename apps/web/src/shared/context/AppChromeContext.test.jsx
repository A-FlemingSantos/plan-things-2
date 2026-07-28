import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LoadingScreen from '../components/Loader/LoadingScreen.jsx'
import { AppChromeProvider, useAppChrome } from './AppChromeContext.jsx'

function LoadingProbe() {
  const { isLoadingScreenActive } = useAppChrome()

  return <span data-testid="loading-active">{String(isLoadingScreenActive)}</span>
}

describe('AppChromeContext', () => {
  it('tracks active loading screens via register/unregister', () => {
    const { rerender } = render(
      <AppChromeProvider>
        <LoadingProbe />
        <LoadingScreen label="Carregando planos" />
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
