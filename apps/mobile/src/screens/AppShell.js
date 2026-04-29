import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BottomTabs from '../components/BottomTabs'
import HomeScreen from './HomeScreen'
import InboxScreen from './InboxScreen'
import FilesScreen from './FilesScreen'
import SettingsScreen from './SettingsScreen'
import { theme } from '../theme/tokens'

const bottomTabsOverlayHeight = 69

export default function AppShell({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('home')

  const handleTabChange = useCallback((nextTab) => {
    setActiveTab(nextTab)
  }, [])

  return (
    <View style={styles.shell}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.page}>
          {activeTab === 'home' ? <HomeScreen session={session} /> : null}
          {activeTab === 'inbox' ? <InboxScreen /> : null}
          {activeTab === 'files' ? (
            <FilesScreen bottomOverlayOffset={bottomTabsOverlayHeight} />
          ) : null}
          {activeTab === 'settings' ? <SettingsScreen session={session} onLogout={onLogout} /> : null}
        </View>
        <BottomTabs activeTab={activeTab} onChange={handleTabChange} />
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  safe: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  page: {
    flex: 1,
    zIndex: 2,
  },
})
