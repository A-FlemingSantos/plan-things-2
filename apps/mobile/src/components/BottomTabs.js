import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Files, Home, Inbox, Settings } from 'lucide-react-native'
import { theme } from '../theme/tokens'

const icons = {
  home: Home,
  inbox: Inbox,
  files: Files,
  settings: Settings,
}

export const tabs = [
  { id: 'home', label: 'Home' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'files', label: 'Arquivos' },
  { id: 'settings', label: 'Ajustes' },
]

export default function BottomTabs({ activeTab, onChange }) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const Icon = icons[tab.id]
        const active = activeTab === tab.id
        return (
          <Pressable
            key={tab.id}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => onChange(tab.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Icon size={18} color={active ? theme.colors.text1 : theme.colors.text3} strokeWidth={1.8} />
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 4,
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: theme.radius.md,
  },
  itemActive: {
    backgroundColor: theme.colors.surface3,
  },
  label: {
    color: theme.colors.text3,
    fontSize: 11,
  },
  labelActive: {
    color: theme.colors.text1,
    fontWeight: '600',
  },
})
