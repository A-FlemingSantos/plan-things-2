import { useMemo, useState } from 'react'
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native'
import { Bell, Paperclip, Search, SquarePen } from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'
import AuthenticatedAvatar from '../components/AuthenticatedAvatar'
import { inboxThreads } from '../data/demoData'
import { theme } from '../theme/tokens'
import { useMobileTheme, useThemedStyles } from '../theme/ThemeProvider'

export default function InboxScreen() {
  styles = useThemedStyles(createStyles)
  const { statusBarStyle } = useMobileTheme()
  const [activeMailbox, setActiveMailbox] = useState('highlights')

  const sections = useMemo(() => {
    const filtered = inboxThreads.filter((thread) => thread.mailbox === activeMailbox)
    const grouped = new Map()
    for (const thread of filtered) {
      const key = thread.group ?? ''
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key).push(thread)
    }

    const orderedGroups = ['', 'Semana passada', 'Este mês']
    return orderedGroups
      .filter((group) => grouped.has(group))
      .map((group) => ({ title: group, data: grouped.get(group) }))
  }, [activeMailbox])

  return (
    <View style={styles.page}>
      <StatusBar style={statusBarStyle} />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <View style={styles.header}>
            <View style={styles.topbar}>
              <View style={styles.topbarText}>
                <Text style={styles.pageTitle}>Caixa de Entrada</Text>
                <Text style={styles.pageSubtitle}>
                  {activeMailbox === 'highlights' ? 'Destaques' : 'Outros'} · {sections.reduce((acc, section) => acc + section.data.length, 0)}
                </Text>
              </View>
              <View style={styles.topbarActions}>
                <Pressable accessibilityRole="button" accessibilityLabel="Notificações" style={styles.actionBtn}>
                  <Bell size={18} color={theme.colors.textInverse} strokeWidth={1.9} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Buscar" style={styles.actionBtn}>
                  <Search size={18} color={theme.colors.textInverse} strokeWidth={1.9} />
                </Pressable>
              </View>
            </View>

            <View style={styles.controlsRow}>
              <View style={styles.segment}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeMailbox === 'highlights' }}
                  onPress={() => setActiveMailbox('highlights')}
                  style={({ pressed }) => [
                    styles.segmentItem,
                    activeMailbox === 'highlights' && styles.segmentItemActive,
                    pressed && styles.segmentItemPressed,
                  ]}
                >
                  <Text style={[styles.segmentText, activeMailbox === 'highlights' && styles.segmentTextActive]}>
                    Destaques
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeMailbox === 'others' }}
                  onPress={() => setActiveMailbox('others')}
                  style={({ pressed }) => [
                    styles.segmentItem,
                    activeMailbox === 'others' && styles.segmentItemActive,
                    pressed && styles.segmentItemPressed,
                  ]}
                >
                  <Text style={[styles.segmentText, activeMailbox === 'others' && styles.segmentTextActive]}>
                    Outros
                  </Text>
                </Pressable>
              </View>

              <Pressable accessibilityRole="button" accessibilityLabel="Filtrar" style={styles.filterButton}>
                <Text style={styles.filterText}>Filtrar</Text>
              </Pressable>
            </View>
          </View>
        )}
        renderSectionHeader={({ section }) => (
          section.title ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          ) : null
        )}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.thread, pressed && styles.threadPressed]}>
            <AuthenticatedAvatar
              style={[styles.avatar, { backgroundColor: item.avatarColor }]}
              textStyle={styles.avatarText}
              avatarUrl={item.avatarUrl}
              fallback={item.avatarText}
              accessibilityLabel={`Avatar de ${item.from}`}
            />

            <View style={styles.threadBody}>
              <View style={styles.threadTopRow}>
                <View style={styles.threadTopLeft}>
                  {item.external ? (
                    <View style={styles.externalChip}>
                      <Text style={styles.externalChipText}>Externo</Text>
                    </View>
                  ) : null}
                  <Text style={styles.sender} numberOfLines={1}>{item.sender}</Text>
                </View>

                <View style={styles.threadTopRight}>
                  <Text style={styles.dateLabel}>{item.dateLabel}</Text>
                  {item.hasAttachment ? (
                    <Paperclip size={14} color={theme.colors.text3} strokeWidth={2} />
                  ) : null}
                </View>
              </View>

              <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
              <Text style={styles.snippet} numberOfLines={1}>{item.snippet}</Text>
            </View>
          </Pressable>
        )}
      />

      <Pressable accessibilityRole="button" accessibilityLabel="Nova mensagem" style={styles.fab}>
        <SquarePen size={21} color={stylesVars.accent} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

const stylesVars = {
  accent: '#12263f',
}

const createStyles = (theme) => StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  header: {
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 20,
    paddingBottom: 14,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 14,
  },
  topbarText: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    color: theme.colors.text1,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '400',
  },
  pageSubtitle: {
    color: theme.colors.text3,
    fontSize: 13,
    marginTop: 2,
  },
  topbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: theme.colors.text1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 10,
    backgroundColor: theme.colors.surface2,
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
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
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
  filterButton: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text1,
  },
  filterText: {
    color: theme.colors.textInverse,
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 148,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 18,
    paddingBottom: 10,
    backgroundColor: theme.colors.appBg,
  },
  sectionTitle: {
    color: theme.colors.text2,
    fontSize: 14,
    fontWeight: '500',
  },
  thread: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: theme.spacing.screenX,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
  },
  threadPressed: {
    backgroundColor: theme.colors.surface2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  threadBody: {
    flex: 1,
    gap: 4,
    paddingTop: 1,
  },
  threadTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  threadTopLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  sender: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 16,
    fontWeight: '500',
  },
  threadTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    color: theme.colors.text3,
    fontSize: 13,
    fontWeight: '500',
  },
  externalChip: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface3,
    borderWidth: 1,
    borderColor: theme.colors.border1,
  },
  externalChipText: {
    color: theme.colors.text2,
    fontSize: 12,
    fontWeight: '500',
  },
  subject: {
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '600',
  },
  snippet: {
    color: theme.colors.text2,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.screenX,
    bottom: 84,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: stylesVars.accent,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
})

let styles = createStyles(theme)
