import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AppChromeContext = createContext(null)

export function AppChromeProvider({ children }) {
  const [loadingScreenCount, setLoadingScreenCount] = useState(0)
  const [pageBreadcrumbLabel, setPageBreadcrumbLabelState] = useState(null)

  const registerLoadingScreen = useCallback(() => {
    setLoadingScreenCount((count) => count + 1)

    return () => {
      setLoadingScreenCount((count) => Math.max(0, count - 1))
    }
  }, [])

  const setPageBreadcrumbLabel = useCallback((label) => {
    const nextLabel = String(label ?? '').trim()
    setPageBreadcrumbLabelState(nextLabel || null)
  }, [])

  const value = useMemo(() => ({
    isLoadingScreenActive: loadingScreenCount > 0,
    registerLoadingScreen,
    pageBreadcrumbLabel,
    setPageBreadcrumbLabel,
  }), [loadingScreenCount, pageBreadcrumbLabel, registerLoadingScreen, setPageBreadcrumbLabel])

  return (
    <AppChromeContext.Provider value={value}>
      {children}
    </AppChromeContext.Provider>
  )
}

export function useAppChrome() {
  const context = useContext(AppChromeContext)

  if (!context) {
    return {
      isLoadingScreenActive: false,
      registerLoadingScreen: () => () => {},
      pageBreadcrumbLabel: null,
      setPageBreadcrumbLabel: () => {},
    }
  }

  return context
}
