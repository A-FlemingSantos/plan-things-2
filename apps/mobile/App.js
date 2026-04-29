import { useMemo, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import AuthScreen from './src/screens/AuthScreen'
import AppShell from './src/screens/AppShell'
import { demoSession } from './src/data/demoData'
import { theme } from './src/theme/tokens'

export default function App() {
  const [session, setSession] = useState(null)
  const userSession = useMemo(() => session ?? demoSession, [session])
  const content = session ? (
    <AppShell session={userSession} onLogout={() => setSession(null)} />
  ) : (
    <AuthScreen onEnter={(mode, values) => setSession({ ...demoSession, mode, values })} />
  )

  return (
    <View style={Platform.OS === 'web' ? styles.webPreview : styles.nativeRoot}>
      <View style={Platform.OS === 'web' ? styles.webDevice : styles.nativeRoot}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          {content}
        </SafeAreaProvider>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  nativeRoot: {
    flex: 1,
  },
  webPreview: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? '100vh' : undefined,
    alignItems: 'center',
    backgroundColor: theme.colors.surface3,
  },
  webDevice: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    minHeight: Platform.OS === 'web' ? '100vh' : undefined,
    backgroundColor: theme.colors.appBg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 42,
  },
})
