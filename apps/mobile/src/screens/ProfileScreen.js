import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import AuthenticatedAvatar from '../components/AuthenticatedAvatar'
import { useAuth } from '../providers/AuthProvider'
import { platformShadow } from '../theme/shadowStyles'
import { theme } from '../theme/tokens'
import { useThemedStyles } from '../theme/ThemeProvider'
import ProfileFilesTab from './profile/ProfileFilesTab'
import ProfileProjectsTab from './profile/ProfileProjectsTab'
import { getMockRole, profileBannerTheme } from './profile/profileMock'

function ProfileBanner() {
  return (
    <View style={[styles.banner, { backgroundColor: profileBannerTheme.color }]}>
      <View style={[styles.bannerGlow, { backgroundColor: profileBannerTheme.shades[2] }]} />
      <View style={styles.bannerColumns}>
        {profileBannerTheme.shades.map((shade) => (
          <View key={shade} style={[styles.bannerColumn, { backgroundColor: shade }]} />
        ))}
      </View>
    </View>
  )
}

export default function ProfileScreen({ navigation }) {
  styles = useThemedStyles(createStyles)
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useState('projects')
  const role = useMemo(() => getMockRole(session), [session])

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.bannerWrap}>
        <ProfileBanner />
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Pressable
            style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
            onPress={() => navigation.navigate('Settings')}
            accessibilityRole="button"
            accessibilityLabel="Abrir ajustes"
          >
            <Text style={styles.settingsButtonText}>Settings</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.identityRow}>
        <AuthenticatedAvatar
          style={styles.avatar}
          textStyle={styles.avatarText}
          avatarUrl={session.user.avatarUrl}
          fallback={session.user.initials}
          accessibilityLabel={`Avatar de ${session.user.fullName}`}
        />
        <View style={styles.identityBody}>
          <Text style={styles.identityName} numberOfLines={1}>{session.user.fullName}</Text>
          <Text style={styles.identityRole} numberOfLines={1}>{role}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.segment}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'projects' }}
            onPress={() => setActiveTab('projects')}
            style={({ pressed }) => [
              styles.segmentItem,
              activeTab === 'projects' && styles.segmentItemActive,
              pressed && styles.segmentItemPressed,
            ]}
          >
            <Text style={[styles.segmentText, activeTab === 'projects' && styles.segmentTextActive]}>
              Projetos
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'files' }}
            onPress={() => setActiveTab('files')}
            style={({ pressed }) => [
              styles.segmentItem,
              activeTab === 'files' && styles.segmentItemActive,
              pressed && styles.segmentItemPressed,
            ]}
          >
            <Text style={[styles.segmentText, activeTab === 'files' && styles.segmentTextActive]}>
              Arquivos
            </Text>
          </Pressable>
        </View>

        {activeTab === 'projects' ? <ProfileProjectsTab /> : <ProfileFilesTab />}
      </View>
    </ScrollView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  content: {
    paddingBottom: 98,
  },
  bannerWrap: {
    height: 152,
    overflow: 'hidden',
  },
  banner: {
    flex: 1,
  },
  bannerGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    opacity: 0.24,
    right: -70,
    top: -90,
  },
  bannerColumns: {
    position: 'absolute',
    left: theme.spacing.screenX,
    right: theme.spacing.screenX,
    top: 30,
    bottom: 22,
    flexDirection: 'row',
    gap: 7,
  },
  bannerColumn: {
    flex: 1,
    borderRadius: 8,
    opacity: 0.6,
  },
  topBar: {
    position: 'absolute',
    top: 14,
    left: theme.spacing.screenX,
    right: theme.spacing.screenX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarSpacer: {
    flex: 1,
  },
  settingsButton: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  settingsButtonPressed: {
    opacity: 0.82,
  },
  settingsButtonText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: theme.spacing.screenX,
    marginTop: 16,
    marginBottom: theme.spacing.section,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text1,
    borderWidth: 3,
    borderColor: theme.colors.appBg,
    ...platformShadow({
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
      color: theme.colors.black,
      offset: { width: 0, height: 2 },
      opacity: 0.12,
      radius: 6,
    }),
  },
  avatarText: {
    color: theme.colors.textInverse,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  identityBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  identityName: {
    color: theme.colors.text1,
    fontSize: 20,
    fontWeight: '600',
  },
  identityRole: {
    color: theme.colors.text3,
    fontSize: 13,
  },
  body: {
    paddingHorizontal: theme.spacing.screenX,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 10,
    backgroundColor: theme.colors.surface2,
    marginBottom: theme.spacing.section,
  },
  segmentItem: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: theme.colors.surface1,
    ...platformShadow({
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
      color: theme.colors.black,
      offset: { width: 0, height: 2 },
      opacity: 0.08,
      radius: 5,
      elevation: 2,
    }),
  },
  segmentItemPressed: {
    opacity: 0.9,
  },
  segmentText: {
    color: theme.colors.text3,
    fontSize: 13,
  },
  segmentTextActive: {
    color: theme.colors.text1,
    fontWeight: '600',
  },
})

let styles = createStyles(theme)
