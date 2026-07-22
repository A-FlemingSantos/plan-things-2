import { useMemo, useState } from 'react'
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native'
import { Bell, Paperclip, Plus, Search } from 'lucide-react-native'
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

  const threadCount = sections.reduce((acc, section) => acc + section.data.length, 0)

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
                <Text style={styles.eyebrow}>Caixa</Text>
                <Text style={styles.pageTitle}>Inbox</Text>
              </View>
              <View style={styles.topbarActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Notificações"
                  style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                >
                  <Bell size={17} color={theme.colors.text1} strokeWidth={1.8} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Buscar"
                  style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                >
                  <Search size={17} color={theme.colors.text1} strokeWidth={1.8} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Nova mensagem"
                  style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
                >
                  <Plus size={18} color={theme.colors.textInverse} strokeWidth={2} />
                </Pressable>
              </View>
            </View>

            <View style={styles.controlsRow}>
              <View style={styles.segment}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeMailbox === 'highlights' }}
                  onPress={() => setActiveMailbox('highlights')}
                  style={[styles.segmentItem, activeMailbox === 'highlights' && styles.segmentItemActive]}
                >
                  <Text style={[styles.segmentText, activeMailbox === 'highlights' && styles.segmentTextActive]}>
                    Destaques
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeMailbox === 'others' }}
                  onPress={() => setActiveMailbox('others')}
                  style={[styles.segmentItem, activeMailbox === 'others' && styles.segmentItemActive]}
                >
                  <Text style={[styles.segmentText, activeMailbox === 'others' && styles.segmentTextActive]}>
                    Outros
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.countMeta}>{threadCount}</Text>
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
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.thread, pressed && styles.threadPressed]}
          >
            <AuthenticatedAvatar
              style={[styles.avatar, { backgroundColor: item.avatarColor || theme.colors.surface3 }]}
              textStyle={styles.avatarText}
              avatarUrl={item.avatarUrl}
              fallback={item.avatarText}
              accessibilityLabel={`Avatar de ${item.from}`}
            />

            <View style={styles.threadBody}>
              <View style={styles.threadTopRow}>
                <View style={styles.threadTopLeft}>
                  <Text style={styles.sender} numberOfLines={1}>{item.sender}</Text>
                  {item.external ? (
                    <Text style={styles.externalMark}>Externo</Text>
                  ) : null}
                </View>
                <View style={styles.threadTopRight}>
                  {item.hasAttachment ? (
                    <Paperclip size={13} color={theme.colors.text3} strokeWidth={1.8} />
                  ) : null}
                  <Text style={styles.dateLabel}>{item.dateLabel}</Text>
                </View>
              </View>

              <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
              <Text style={styles.snippet} numberOfLines={2}>{item.snippet}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhuma mensagem</Text>
            <Text style={styles.emptyHint}>
              Quando houver destaques ou outros itens, eles aparecem aqui.
            </Text>
          </View>
        )}
      />
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  listContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 24,
    paddingBottom: 8,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 22,
  },
  topbarText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  eyebrow: {
    color: theme.colors.text3,
    ...theme.type.eyebrow,
    textTransform: 'uppercase',
  },
  pageTitle: {
    color: theme.colors.text1,
    ...theme.type.display,
  },
  topbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  newButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
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
    gap: 2,
    padding: 3,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  segmentItem: {
    paddingHorizontal: 14,
    height: 30,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: theme.colors.surface1,
  },
  segmentText: {
    color: theme.colors.text3,
    fontSize: 13,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: theme.colors.text1,
  },
  countMeta: {
    color: theme.colors.text3,
    fontSize: 13,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 22,
    paddingBottom: 8,
    backgroundColor: theme.colors.appBg,
  },
  sectionTitle: {
    color: theme.colors.text3,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  thread: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: theme.spacing.screenX,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  threadPressed: {
    opacity: 0.72,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  threadBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
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
    flexShrink: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  externalMark: {
    color: theme.colors.text3,
    fontSize: 11,
    fontWeight: '500',
  },
  threadTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    color: theme.colors.text3,
    fontSize: 12.5,
  },
  subject: {
    color: theme.colors.text1,
    fontSize: 14.5,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  snippet: {
    color: theme.colors.text2,
    fontSize: 13.5,
    lineHeight: 18,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: theme.colors.text1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  emptyHint: {
    color: theme.colors.text3,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 260,
  },
  pressed: {
    opacity: 0.75,
  },
})

let styles = createStyles(theme)
