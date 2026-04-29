import { useMemo, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import AuthScreen from './src/screens/AuthScreen'
import AppShell from './src/screens/AppShell'
import { demoSession } from './src/data/demoData'

export default function App() {
  const [session, setSession] = useState(null)
  const userSession = useMemo(() => session ?? demoSession, [session])

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {session ? (
        <AppShell session={userSession} onLogout={() => setSession(null)} />
      ) : (
        <AuthScreen onEnter={(mode, values) => setSession({ ...demoSession, mode, values })} />
      )}
    </SafeAreaProvider>
  )
}
