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
import { MobileThemeProvider, useMobileTheme, useThemedStyles } from './src/theme/ThemeProvider'

const linking = {
  prefixes: ['planthings://'],
  config: {
    screens: {
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

function ThemedAppRoot() {
  styles = useThemedStyles(createStyles)
  const { navigationTheme, statusBarStyle } = useMobileTheme()

  return (
    <View style={Platform.OS === 'web' ? styles.webPreview : styles.nativeRoot}>
      <View style={Platform.OS === 'web' ? styles.webDevice : styles.nativeRoot}>
        <SafeAreaProvider>
          <StatusBar style={statusBarStyle} />
          <NavigationContainer linking={linking} theme={navigationTheme}>
            <AppContent />
          </NavigationContainer>
        </SafeAreaProvider>
      </View>
    </View>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MobileThemeProvider>
        <ThemedAppRoot />
      </MobileThemeProvider>
    </AuthProvider>
  )
}

const createStyles = (theme) => StyleSheet.create({
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

let styles = createStyles(theme)
