import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Bell, ChevronRight, LogOut, Moon, UserRound, Workflow } from 'lucide-react-native'
import ScreenHeader from '../components/ScreenHeader'
import { theme } from '../theme/tokens'

const settings = [
  { id: 'profile', label: 'Conta', value: 'Perfil demo', Icon: UserRound },
  { id: 'workspace', label: 'Workspace', value: 'Sincronização futura', Icon: Workflow },
  { id: 'notifications', label: 'Notificações', value: 'Resumo diário ligado', Icon: Bell },
  { id: 'theme', label: 'Tema', value: 'Claro', Icon: Moon },
]

export default function SettingsScreen({ session, onLogout }) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow={session.user.email} title="Configurações" meta="demo" />

      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{session.user.initials}</Text>
        </View>
        <View style={styles.profileBody}>
          <Text style={styles.profileName}>{session.user.fullName}</Text>
          <Text style={styles.profileMeta}>{session.workspace.name}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {settings.map(({ id, label, value, Icon }) => (
          <View key={id} style={styles.row}>
            <View style={styles.rowIcon}>
              <Icon size={17} color={theme.colors.text2} strokeWidth={1.8} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
            <ChevronRight size={16} color={theme.colors.text3} strokeWidth={1.7} />
          </View>
        ))}
      </View>

      <Pressable style={styles.logout} onPress={onLogout}>
        <LogOut size={16} color={theme.colors.red} strokeWidth={1.8} />
        <Text style={styles.logoutText}>Sair do modo dev</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  content: {
    paddingHorizontal: theme.spacing.screenX,
    paddingBottom: 28,
  },
  profile: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    marginBottom: theme.spacing.section,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text1,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  profileBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  profileName: {
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '600',
  },
  profileMeta: {
    color: theme.colors.text3,
    fontSize: 12,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border1,
  },
  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface3,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '500',
  },
  rowValue: {
    color: theme.colors.text3,
    fontSize: 12,
  },
  logout: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#ffd3d3',
    marginTop: 24,
  },
  logoutText: {
    color: theme.colors.red,
    fontSize: 14,
    fontWeight: '600',
  },
})
