import { useEffect } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as NavigationBar from 'expo-navigation-bar'
import { NavigationContainer } from '@react-navigation/native'
import AuthScreen from './src/screens/AuthScreen'
import AppShell from './src/screens/AppShell'
import { AuthProvider, useAuth } from './src/providers/AuthProvider'
import { PlansProvider } from './src/providers/PlansProvider'
import { FilesProvider } from './src/providers/FilesProvider'
import { platformShadow } from './src/theme/shadowStyles'
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
  const { navigationTheme, statusBarStyle, isDark } = useMobileTheme()
  const auth = useAuth()
  const isAuthScreen = auth.isReady && !auth.isAuthenticated

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined

    async function syncNavigationBar() {
      try {
        if (isAuthScreen) {
          await NavigationBar.setBackgroundColorAsync('#000000')
          await NavigationBar.setButtonStyleAsync('light')
          return
        }

        await NavigationBar.setBackgroundColorAsync(isDark ? '#000000' : '#ffffff')
        await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark')
      } catch {
        // Expo Go / unsupported hosts can ignore navigation bar APIs.
      }
    }

    syncNavigationBar()
  }, [isAuthScreen, isDark])

  const containerTheme = isAuthScreen
    ? {
        ...navigationTheme,
        dark: false,
        colors: {
          ...navigationTheme.colors,
          background: '#ffffff',
          card: '#ffffff',
          text: '#000000',
          border: '#ffffff',
        },
      }
    : navigationTheme

  return (
    <View
      style={[
        Platform.OS === 'web' ? (isAuthScreen ? styles.webFullscreen : styles.webPreview) : styles.nativeRoot,
        isAuthScreen ? styles.fullscreenLight : null,
      ]}
    >
      <View
        style={[
          Platform.OS === 'web' ? (isAuthScreen ? styles.webFullscreenDevice : styles.webDevice) : styles.nativeRoot,
          isAuthScreen ? styles.fullscreenLight : null,
        ]}
      >
        <SafeAreaProvider>
          <StatusBar style={isAuthScreen ? 'dark' : statusBarStyle} translucent backgroundColor="transparent" />
          <NavigationContainer linking={linking} theme={containerTheme}>
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
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web' ? { minHeight: '100dvh' } : null),
  },
  fullscreenLight: {
    backgroundColor: '#ffffff',
  },
  webFullscreen: {
    flex: 1,
    width: '100%',
    height: '100dvh',
    minHeight: '100dvh',
    backgroundColor: '#ffffff',
    ...(Platform.OS === 'web'
      ? {
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }
      : null),
  },
  webFullscreenDevice: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: '100dvh',
    backgroundColor: '#ffffff',
  },
  webPreview: {
    flex: 1,
    width: '100%',
    minHeight: Platform.OS === 'web' ? '100dvh' : undefined,
    height: Platform.OS === 'web' ? '100dvh' : undefined,
    alignItems: 'center',
    backgroundColor: theme.colors.surface3,
  },
  webDevice: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    minHeight: Platform.OS === 'web' ? '100dvh' : undefined,
    height: Platform.OS === 'web' ? '100dvh' : undefined,
    backgroundColor: theme.colors.appBg,
    ...platformShadow({
      boxShadow: '0 18px 42px rgba(0, 0, 0, 0.08)',
      color: theme.colors.black,
      offset: { width: 0, height: 18 },
      opacity: 0.08,
      radius: 42,
    }),
  },
})

let styles = createStyles(theme)
