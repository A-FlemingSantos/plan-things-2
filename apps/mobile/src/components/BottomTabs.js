import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BookOpen, Home, Inbox, PackageOpen, User } from 'lucide-react-native'
import { theme } from '../theme/tokens'
import { useAppTheme, useThemedStyles } from '../theme/ThemeProvider'

export const BOTTOM_TAB_BAR_HEIGHT = 49

const icons = {
  home: Home,
  inbox: Inbox,
  files: PackageOpen,
  docs: BookOpen,
  profile: User,
}

export const tabs = [
  { id: 'home', label: 'Home' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'files', label: 'Arquivos' },
  { id: 'docs', label: 'Docs' },
  { id: 'profile', label: 'Perfil' },
]

export default function BottomTabs({ activeTab, onChange, state, navigation }) {
  styles = useThemedStyles(createStyles)
  const activeTheme = useAppTheme()
  const insets = useSafeAreaInsets()
  const currentTab = state?.routes[state.index]?.name ?? activeTab
  const handleChange = (tabId) => {
    if (navigation) {
      navigation.navigate(tabId)
      return
    }
    onChange?.(tabId)
  }

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 4) }]}>
      {tabs.map((tab) => {
        const Icon = icons[tab.id]
        const active = currentTab === tab.id
        const iconColor = active
          ? activeTheme.colors.text1
          : activeTheme.colors.text1 + (activeTheme.isDark ? '66' : '59')
        return (
          <Pressable
            key={tab.id}
            style={styles.item}
            onPress={() => handleChange(tab.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Icon size={16} color={iconColor} strokeWidth={active ? 2 : 1.75} />
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 2,
    paddingTop: 4,
    paddingHorizontal: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)',
    backgroundColor: theme.colors.appBg,
  },
  item: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    color: theme.colors.text1,
    opacity: 0.38,
    fontSize: 9,
    letterSpacing: 0.1,
  },
  labelActive: {
    opacity: 1,
    fontWeight: '600',
  },
})

let styles = createStyles(theme)
