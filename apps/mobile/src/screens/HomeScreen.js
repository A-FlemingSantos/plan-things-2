import { useMemo, useState } from 'react'
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native'
import { ImageOff, LayoutGrid, Plus, Rows3, Search, X } from 'lucide-react-native'
import AuthenticatedAvatar from '../components/AuthenticatedAvatar'
import AuthenticatedImage from '../components/AuthenticatedImage'
import NewPlanSheet from '../components/NewPlanSheet'
import { resolveLocalCoverSource } from '../data/backgroundCollections'
import { useAuth } from '../providers/AuthProvider'
import { usePlans } from '../providers/PlansProvider'
import { theme } from '../theme/tokens'
import { useThemedStyles } from '../theme/ThemeProvider'

function resolveCoverImageUrl(coverImageId) {
  if (typeof coverImageId !== 'string') return null
  const normalized = coverImageId.trim().replace(/\\/g, '/')
  if (!normalized.startsWith('files/')) return null
  const fileId = normalized.slice('files/'.length)
  return fileId ? `/api/files/${fileId}/download` : null
}

function greetingForHour(hour) {
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function EmptyCover({ style, iconSize = 20 }) {
  return (
    <View style={[style, styles.emptyCover]}>
      <ImageOff size={iconSize} color={theme.colors.text3} strokeWidth={1.6} />
    </View>
  )
}

function CoverSurface({ plan, style, iconSize }) {
  const remoteUrl = resolveCoverImageUrl(plan.coverImageId)
  const localSource = resolveLocalCoverSource(plan.coverImageId)
  if (remoteUrl) {
    return (
      <AuthenticatedImage
        source={remoteUrl}
        style={style}
        fallback={<EmptyCover style={style} iconSize={iconSize} />}
      />
    )
  }
  if (localSource) {
    return <Image source={localSource} style={style} resizeMode="cover" />
  }
  if (plan.cover) {
    return <View style={[style, { backgroundColor: plan.cover }]} />
  }
  return <EmptyCover style={style} iconSize={iconSize} />
}

function PlanGridCard({ plan, width, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.gridCard, { width }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Abrir plano ${plan.name}`}
    >
      <CoverSurface plan={plan} style={styles.gridCover} iconSize={22} />
      <View style={styles.gridBody}>
        <Text style={styles.gridName} numberOfLines={1}>{plan.name}</Text>
      </View>
    </Pressable>
  )
}

function PlanListRow({ plan, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Abrir plano ${plan.name}`}
    >
      <CoverSurface plan={plan} style={styles.listCover} iconSize={18} />
      <Text style={styles.listName} numberOfLines={1}>{plan.name}</Text>
    </Pressable>
  )
}

export default function HomeScreen({ navigation }) {
  styles = useThemedStyles(createStyles)
  const { session } = useAuth()
  const { plans, createPlan: createRemotePlan } = usePlans()
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [newPlanSheetOpen, setNewPlanSheetOpen] = useState(false)
  const { width } = useWindowDimensions()

  const gap = 12
  const contentWidth = Math.min(width, 430) - theme.spacing.screenX * 2
  const cardWidth = (contentWidth - gap) / 2

  const firstName = useMemo(() => {
    const full = session?.user?.fullName ?? ''
    return full.split(' ').filter(Boolean)[0] || 'Olá'
  }, [session?.user?.fullName])
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), [])

  const filteredPlans = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return plans
    return plans.filter((plan) => [plan.name, plan.tag, plan.description]
      .some((value) => String(value ?? '').toLowerCase().includes(term)))
  }, [plans, search])

  const openNewPlanSheet = () => {
    setNewPlanSheetOpen(true)
  }

  const handleCreatePlan = async ({ name, selected }) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const payload = {
      name: trimmed,
      description: '',
      coverThemeId: null,
      coverImageId: selected?.type === 'image' ? selected.id : null,
      cover: null,
    }
    const newPlan = await createRemotePlan(payload)
    setSearch('')
    setNewPlanSheetOpen(false)
    navigation.navigate('Board', { planId: newPlan.id })
  }

  const openPlan = (plan) => {
    navigation.navigate('Board', { planId: plan.id })
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.title} numberOfLines={1}>{firstName}</Text>
        </View>
        <AuthenticatedAvatar
          style={styles.avatar}
          textStyle={styles.avatarText}
          avatarUrl={session?.user?.avatarUrl}
          fallback={session?.user?.initials ?? 'PT'}
          accessibilityLabel={session?.user?.fullName ? `Avatar de ${session.user.fullName}` : 'Avatar'}
        />
      </View>

      <View style={styles.searchBar}>
        <View style={styles.searchWrap}>
          <Search size={16} color={theme.colors.text3} strokeWidth={1.8} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar planos"
            placeholderTextColor={theme.colors.text3}
            style={styles.searchInput}
            selectionColor={theme.colors.text1}
            autoCorrect={false}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Limpar busca">
              <X size={15} color={theme.colors.text3} strokeWidth={1.8} />
            </Pressable>
          ) : null}
        </View>
        <Pressable style={styles.newButton} onPress={openNewPlanSheet} accessibilityRole="button" accessibilityLabel="Criar novo plano">
          <Plus size={19} color={theme.colors.textInverse} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.sectionRow}>
        <View style={styles.sectionLeft}>
          <Text style={styles.sectionTitle}>Planos</Text>
          <Text style={styles.sectionCount}>{filteredPlans.length}</Text>
        </View>
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
            onPress={() => setViewMode('grid')}
            accessibilityRole="button"
            accessibilityLabel="Visualização em grade"
          >
            <LayoutGrid size={16} color={viewMode === 'grid' ? theme.colors.text1 : theme.colors.text3} strokeWidth={1.8} />
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
            accessibilityRole="button"
            accessibilityLabel="Visualização em lista"
          >
            <Rows3 size={16} color={viewMode === 'list' ? theme.colors.text1 : theme.colors.text3} strokeWidth={1.8} />
          </Pressable>
        </View>
      </View>

      {filteredPlans.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Search size={18} color={theme.colors.text3} strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyTitle}>
            {search ? 'Nenhum plano encontrado' : 'Nenhum plano ainda'}
          </Text>
          <Text style={styles.emptyHint}>
            {search ? 'Tente buscar por outro termo.' : 'Crie seu primeiro plano para começar a organizar o trabalho.'}
          </Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => (search ? setSearch('') : openNewPlanSheet())}
            accessibilityRole="button"
          >
            <Text style={styles.emptyButtonText}>{search ? 'Limpar busca' : 'Criar plano'}</Text>
          </Pressable>
        </View>
      ) : viewMode === 'grid' ? (
        <View style={[styles.grid, { columnGap: gap, rowGap: gap }]}>
          {filteredPlans.map((plan) => (
            <PlanGridCard key={plan.id} plan={plan} width={cardWidth} onPress={() => openPlan(plan)} />
          ))}
          <Pressable style={[styles.newGridCard, { width: cardWidth }]} onPress={openNewPlanSheet} accessibilityRole="button">
            <View style={styles.newGridIcon}>
              <Plus size={16} color={theme.colors.text2} strokeWidth={1.8} />
            </View>
            <Text style={styles.newGridLabel}>Novo plano</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredPlans.map((plan) => (
            <PlanListRow key={plan.id} plan={plan} onPress={() => openPlan(plan)} />
          ))}
          <Pressable style={styles.newListRow} onPress={openNewPlanSheet} accessibilityRole="button">
            <View style={styles.newGridIcon}>
              <Plus size={16} color={theme.colors.text2} strokeWidth={1.8} />
            </View>
            <Text style={styles.newGridLabel}>Novo plano</Text>
          </Pressable>
        </View>
      )}

      <NewPlanSheet
        visible={newPlanSheetOpen}
        onClose={() => setNewPlanSheetOpen(false)}
        onCreate={handleCreatePlan}
      />
    </ScrollView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  content: {
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 24,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  greeting: {
    color: theme.colors.text3,
    ...theme.type.eyebrow,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text1,
    ...theme.type.display,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  avatarText: {
    color: theme.colors.text1,
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  searchWrap: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 15,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  newButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.text1,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  sectionTitle: {
    color: theme.colors.text1,
    ...theme.type.heading,
  },
  sectionCount: {
    color: theme.colors.text3,
    fontSize: 13,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 3,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  toggleBtn: {
    width: 34,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.surface1,
  },
  pressed: {
    opacity: 0.75,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  gridCard: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  gridCover: {
    height: 78,
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  emptyCover: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  gridBody: {
    paddingHorizontal: 13,
    paddingVertical: 13,
  },
  gridName: {
    color: theme.colors.text1,
    fontSize: 14.5,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  newGridCard: {
    minHeight: 125,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border2,
  },
  newGridIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: theme.colors.surface3,
  },
  newGridLabel: {
    color: theme.colors.text2,
    fontSize: 13,
  },
  list: {
    gap: 2,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  listCover: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  listName: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  newListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    marginBottom: 4,
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
    maxWidth: 280,
  },
  emptyButton: {
    minHeight: 40,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.text1,
  },
  emptyButtonText: {
    color: theme.colors.textInverse,
    fontSize: 13,
    fontWeight: '600',
  },
})

let styles = createStyles(theme)
