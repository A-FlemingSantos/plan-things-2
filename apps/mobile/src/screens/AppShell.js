import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BottomTabs from '../components/BottomTabs'
import HomeScreen from './HomeScreen'
import InboxScreen from './InboxScreen'
import FilesScreen from './FilesScreen'
import SettingsScreen from './SettingsScreen'
import { theme } from '../theme/tokens'

export default function AppShell({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.page}>
        {activeTab === 'home' ? <HomeScreen session={session} /> : null}
        {activeTab === 'inbox' ? <InboxScreen /> : null}
        {activeTab === 'files' ? <FilesScreen /> : null}
        {activeTab === 'settings' ? <SettingsScreen session={session} onLogout={onLogout} /> : null}
      </View>
      <BottomTabs activeTab={activeTab} onChange={setActiveTab} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  page: {
    flex: 1,
  },
})
