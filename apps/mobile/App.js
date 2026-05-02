import { Platform, StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import AuthScreen from './src/screens/AuthScreen'
import AppShell from './src/screens/AppShell'
import { AuthProvider, useAuth } from './src/providers/AuthProvider'
import { PlansProvider } from './src/providers/PlansProvider'
import { FilesProvider } from './src/providers/FilesProvider'
import { theme } from './src/theme/tokens'

const linking = {
  prefixes: ['planthings://'],
  config: {
    screens: {
      OAuthCallback: 'oauth/callback',
      App: {
        screens: {
          home: '',
          files: 'files',
          settings: 'settings',
        },
      },
    },
  },
}

function AppContent() {
  const auth = useAuth()

  if (!auth.isReady) {
    return null
  }

  return auth.isAuthenticated ? (
    <PlansProvider>
      <FilesProvider>
        <AppShell />
      </FilesProvider>
    </PlansProvider>
  ) : (
    <AuthScreen />
  )
}

export default function App() {
  return (
    <View style={Platform.OS === 'web' ? styles.webPreview : styles.nativeRoot}>
      <View style={Platform.OS === 'web' ? styles.webDevice : styles.nativeRoot}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <AuthProvider>
            <NavigationContainer linking={linking}>
              <AppContent />
            </NavigationContainer>
          </AuthProvider>
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
