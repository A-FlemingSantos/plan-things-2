import { useMemo, useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native'
import { Check, Grid2X2, List, Plus, Search, X } from 'lucide-react-native'
import BottomSheet from '../components/BottomSheet'
import { useAuth } from '../providers/AuthProvider'
import { usePlans } from '../providers/PlansProvider'
import { theme } from '../theme/tokens'

const coverThemes = [
  {
    id: 'atelier',
    color: '#4b4f4d',
    shades: ['#877153', '#c0b08e', '#121312'],
    tint: '#ece5d5',
    tag: 'Produto',
  },
  {
    id: 'midnight',
    color: '#12263f',
    shades: ['#06111f', '#284b74', '#7bb2d9'],
    tint: '#dde8f8',
    tag: 'Engenharia',
  },
  {
    id: 'horizon',
    color: '#5e548e',
    shades: ['#231942', '#9f86c0', '#e0b1cb'],
    tint: '#eee6f8',
    tag: 'Design',
  },
  {
    id: 'ember',
    color: '#61304c',
    shades: ['#170f15', '#b34e6a', '#f49a61'],
    tint: '#f5e2dc',
    tag: 'Operações',
  },
]

const planMeta = [
  {
    description: 'Preparar entregas do trimestre e revisar pontos pendentes.',
    date: '3 ago',
  },
  {
    description: 'Alinhar endpoints, contratos e próximos testes da equipe.',
    date: '8 ago',
  },
  {
    description: 'Organizar direção visual, arquivos e decisões recentes.',
    date: 'Hoje',
  },
  {
    description: 'Acompanhar tarefas pontuais da base mobile em progresso.',
    date: '12 ago',
  },
]

function getPlanViewModel(plan, index) {
  const baseCover = coverThemes.find((coverTheme) => coverTheme.id === plan.coverThemeId) ?? coverThemes[index % coverThemes.length]
  const cover = {
    ...baseCover,
    tag: plan.tag ?? baseCover.tag,
  }
  const meta = planMeta[index % planMeta.length]

  return {
    ...meta,
    ...plan,
    description: plan.description || meta.description,
    date: plan.date || meta.date,
    cover,
  }
}

function PlanCover({ cover }) {
  return (
    <View style={[styles.planCover, { backgroundColor: cover.color }]}>
      <View style={[styles.coverGlow, { backgroundColor: cover.shades[2] }]} />
      <View style={styles.coverColumns}>
        {cover.shades.map((shade) => (
          <View key={shade} style={[styles.coverColumn, { backgroundColor: shade }]} />
        ))}
      </View>
    </View>
  )
}

function MiniPlanCover({ cover }) {
  return (
    <View style={[styles.miniCover, { backgroundColor: cover.color }]}>
      <View style={[styles.miniCoverGlow, { backgroundColor: cover.shades[2] }]} />
      <View style={styles.miniCoverColumns}>
        {cover.shades.map((shade) => (
          <View key={shade} style={[styles.miniCoverColumn, { backgroundColor: shade }]} />
        ))}
      </View>
    </View>
  )
}

function PlanCard({ plan, width, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.planCard,
        active && styles.planCardActive,
        { width },
        pressed && styles.planCardPressed,
      ]}
    >
      <PlanCover cover={plan.cover} />
      <View style={styles.cardBody}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={2}>{plan.name}</Text>
          <Text style={styles.cardTaskCount}>{plan.tasks}</Text>
        </View>
        <View style={styles.cardMetaRow}>
          <Text
            style={[
              styles.cardTag,
              { backgroundColor: plan.cover.tint, color: plan.cover.color },
            ]}
            numberOfLines={1}
          >
            {plan.cover.tag}
          </Text>
          <Text style={styles.cardDate}>{plan.date}</Text>
        </View>
      </View>
    </Pressable>
  )
}

function PlanListRow({ plan, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.planListRow,
        active && styles.planListRowActive,
        pressed && styles.planCardPressed,
      ]}
    >
      <MiniPlanCover cover={plan.cover} />
      <View style={styles.planListBody}>
        <View style={styles.planListTop}>
          <Text style={styles.planListName} numberOfLines={1}>{plan.name}</Text>
          <Text style={styles.planListCount}>{plan.tasks}</Text>
        </View>
        <Text style={styles.planListDescription} numberOfLines={1}>{plan.description}</Text>
        <View style={styles.planListMetaRow}>
          <Text
            style={[
              styles.cardTag,
              { backgroundColor: plan.cover.tint, color: plan.cover.color },
            ]}
            numberOfLines={1}
          >
            {plan.cover.tag}
          </Text>
          <Text style={styles.cardDate}>{plan.date}</Text>
        </View>
      </View>
    </Pressable>
  )
}

export default function HomeScreen({ navigation }) {
  const { session } = useAuth()
  const { plans, createPlan: createRemotePlan } = usePlans()
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [newPlanSheetOpen, setNewPlanSheetOpen] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [selectedCoverId, setSelectedCoverId] = useState(coverThemes[0].id)
  const { width } = useWindowDimensions()
  const gap = 10
  const contentWidth = Math.min(width, 430) - theme.spacing.screenX * 2
  const cardWidth = (contentWidth - gap) / 2

  const enrichedPlans = useMemo(() => plans.map(getPlanViewModel), [plans])
  const selectedCover = coverThemes.find((cover) => cover.id === selectedCoverId) ?? coverThemes[0]
  const filteredPlans = enrichedPlans.filter((plan) => {
    const term = search.trim().toLowerCase()
    if (!term) return true

    return [
      plan.name,
      plan.cover.tag,
      plan.description,
    ].some((value) => value.toLowerCase().includes(term))
  })
  const currentPlan = enrichedPlans[0]

  const openNewPlanSheet = () => {
    setNewPlanName('')
    setSelectedCoverId(coverThemes[0].id)
    setNewPlanSheetOpen(true)
  }

  const closeNewPlanSheet = () => {
    setNewPlanSheetOpen(false)
  }

  const createPlan = async () => {
    const name = newPlanName.trim()
    if (!name) return

    const newPlan = await createRemotePlan({
      name,
      description: '',
      cover: selectedCover.color,
      coverThemeId: selectedCover.id,
    })

    setSearch('')
    closeNewPlanSheet()
    navigation.navigate('Board', { planId: newPlan.id })
  }

  const openPlan = (plan) => {
    navigation.navigate('Board', { planId: plan.id })
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.pageTitle}>Início</Text>
          <Text style={styles.pageSubtitle}>Bom dia, {session.user.fullName.split(' ')[0]}.</Text>
        </View>
        <Pressable style={styles.newPlanBtn} onPress={openNewPlanSheet} accessibilityRole="button" accessibilityLabel="Criar novo plano">
          <Plus size={16} color={theme.colors.white} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Search size={15} color={theme.colors.text3} strokeWidth={1.8} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar planos..."
          placeholderTextColor={theme.colors.text3}
          style={styles.searchInput}
          selectionColor={theme.colors.text1}
          autoCorrect={false}
        />
        {search ? (
          <Pressable style={styles.searchClear} onPress={() => setSearch('')} hitSlop={8}>
            <X size={14} color={theme.colors.text2} strokeWidth={1.8} />
          </Pressable>
        ) : null}
      </View>

      {currentPlan ? (
        <View style={styles.currentPlanPanel}>
          <View style={styles.currentPlanCopy}>
            <Text style={styles.currentPlanEyebrow}>Plano atual</Text>
            <View style={styles.currentPlanTitleRow}>
              <Text style={styles.currentPlanTitle} numberOfLines={1}>{currentPlan.name}</Text>
              <Text
                style={[
                  styles.currentPlanTag,
                  { backgroundColor: currentPlan.cover.tint, color: currentPlan.cover.color },
                ]}
              >
                {currentPlan.cover.tag}
              </Text>
            </View>
            <Text style={styles.currentPlanText} numberOfLines={2}>{currentPlan.description}</Text>
          </View>
          <Pressable style={styles.currentPlanAction} onPress={() => openPlan(currentPlan)}>
            <Grid2X2 size={14} color={theme.colors.text1} strokeWidth={1.8} />
            <Text style={styles.currentPlanActionText}>Abrir quadro</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <Text style={styles.sectionTitle}>Todos os planos</Text>
          <Text style={styles.planCount}>{filteredPlans.length}</Text>
        </View>
        <View style={styles.viewToggle}>
          <Pressable
            style={[
              styles.viewToggleBtn,
              viewMode === 'grid' && styles.viewToggleBtnActive,
            ]}
            onPress={() => setViewMode('grid')}
            accessibilityRole="button"
            accessibilityLabel="Visualizacao em grade"
          >
            <Grid2X2
              size={15}
              color={viewMode === 'grid' ? theme.colors.text1 : theme.colors.text3}
              strokeWidth={1.8}
            />
          </Pressable>
          <Pressable
            style={[
              styles.viewToggleBtn,
              viewMode === 'list' && styles.viewToggleBtnActive,
            ]}
            onPress={() => setViewMode('list')}
            accessibilityRole="button"
            accessibilityLabel="Visualizacao em lista"
          >
            <List
              size={16}
              color={viewMode === 'list' ? theme.colors.text1 : theme.colors.text3}
              strokeWidth={1.8}
            />
          </Pressable>
        </View>
      </View>

      {filteredPlans.length && viewMode === 'grid' ? (
        <View style={[styles.grid, { columnGap: gap, rowGap: gap }]}>
          {filteredPlans.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              width={cardWidth}
              active={index === 0 && !search}
              onPress={() => openPlan(plan)}
            />
          ))}
          <Pressable style={[styles.newPlanCard, { width: cardWidth }]} onPress={openNewPlanSheet} accessibilityRole="button">
            <View style={styles.newPlanIcon}>
              <Plus size={15} color={theme.colors.text2} strokeWidth={1.8} />
            </View>
            <Text style={styles.newPlanCardLabel}>Novo plano</Text>
          </Pressable>
        </View>
      ) : filteredPlans.length ? (
        <View style={styles.planList}>
          {filteredPlans.map((plan, index) => (
            <PlanListRow
              key={plan.id}
              plan={plan}
              active={index === 0 && !search}
              onPress={() => openPlan(plan)}
            />
          ))}
          <Pressable style={styles.newPlanListRow} onPress={openNewPlanSheet} accessibilityRole="button">
            <View style={styles.newPlanIcon}>
              <Plus size={15} color={theme.colors.text2} strokeWidth={1.8} />
            </View>
            <Text style={styles.newPlanListLabel}>Novo plano</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Search size={18} color={theme.colors.text3} strokeWidth={1.8} />
          <Text style={styles.emptyStateTitle}>Nenhum plano encontrado</Text>
          <Pressable style={styles.emptyStateBtn} onPress={() => setSearch('')}>
            <Text style={styles.emptyStateBtnText}>Limpar busca</Text>
          </Pressable>
        </View>
      )}

      <BottomSheet visible={newPlanSheetOpen} onClose={closeNewPlanSheet} title="Criar plano">
        <View style={styles.planSheetPreview}>
          <PlanCover cover={selectedCover} />
          <View style={styles.planSheetPreviewBody}>
            <Text style={styles.planSheetPreviewName} numberOfLines={1}>
              {newPlanName.trim() || 'Novo plano'}
            </Text>
            <Text
              style={[
                styles.cardTag,
                { backgroundColor: selectedCover.tint, color: selectedCover.color },
              ]}
            >
              {selectedCover.tag}
            </Text>
          </View>
        </View>

        <Text style={styles.planSheetLabel}>Nome</Text>
        <TextInput
          value={newPlanName}
          onChangeText={setNewPlanName}
          placeholder="Ex.: Planejamento mobile"
          placeholderTextColor={theme.colors.text3}
          style={styles.planSheetInput}
          selectionColor={theme.colors.text1}
          autoCorrect={false}
        />

        <Text style={styles.planSheetLabel}>Categoria e capa</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.planThemeRow}>
          {coverThemes.map((cover) => {
            const isSelected = selectedCoverId === cover.id

            return (
              <Pressable
                key={cover.id}
                style={[styles.planThemeOption, isSelected && styles.planThemeOptionActive]}
                onPress={() => setSelectedCoverId(cover.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.planThemeSwatch, { backgroundColor: cover.color }]}>
                  {cover.shades.map((shade) => (
                    <View key={shade} style={[styles.planThemeSwatchBar, { backgroundColor: shade }]} />
                  ))}
                </View>
                <Text style={styles.planThemeLabel}>{cover.tag}</Text>
                {isSelected ? (
                  <View style={styles.planThemeCheck}>
                    <Check size={12} color={theme.colors.white} strokeWidth={2.1} />
                  </View>
                ) : null}
              </Pressable>
            )
          })}
        </ScrollView>

        <Pressable
          style={[styles.planSheetSubmit, !newPlanName.trim() && styles.planSheetSubmitDisabled]}
          onPress={createPlan}
          disabled={!newPlanName.trim()}
          accessibilityRole="button"
          accessibilityState={{ disabled: !newPlanName.trim() }}
        >
          <Text style={[styles.planSheetSubmitText, !newPlanName.trim() && styles.planSheetSubmitTextDisabled]}>
            Criar plano
          </Text>
        </Pressable>
      </BottomSheet>
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
    paddingTop: 20,
    paddingBottom: 98,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 14,
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
  newPlanBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: theme.colors.text1,
  },
  searchWrap: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 10,
    backgroundColor: theme.colors.surface1,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 14,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  searchClear: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPlanPanel: {
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 14,
    backgroundColor: theme.colors.surface2,
    marginBottom: 20,
  },
  currentPlanCopy: {
    gap: 7,
  },
  currentPlanEyebrow: {
    color: theme.colors.text3,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  currentPlanTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPlanTitle: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '500',
  },
  currentPlanTag: {
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
  },
  currentPlanText: {
    color: theme.colors.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  currentPlanAction: {
    minHeight: 38,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 9,
    backgroundColor: theme.colors.surface1,
  },
  currentPlanActionText: {
    color: theme.colors.text1,
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: theme.colors.text1,
    fontSize: 16,
    fontWeight: '600',
  },
  planCount: {
    minWidth: 24,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: theme.colors.surface3,
    color: theme.colors.text2,
    fontSize: 12,
    textAlign: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 9,
    backgroundColor: theme.colors.surface2,
  },
  viewToggleBtn: {
    width: 32,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  viewToggleBtnActive: {
    backgroundColor: theme.colors.surface1,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  planCard: {
    minHeight: 136,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 10,
    backgroundColor: theme.colors.surface1,
  },
  planCardActive: {
    borderColor: theme.colors.focus,
    shadowColor: theme.colors.focus,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  planCardPressed: {
    opacity: 0.82,
  },
  planCover: {
    height: 62,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
  },
  coverGlow: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 999,
    opacity: 0.32,
    right: -26,
    top: -22,
  },
  coverColumns: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 10,
    bottom: 9,
    flexDirection: 'row',
    gap: 5,
  },
  coverColumn: {
    flex: 1,
    borderRadius: 6,
    opacity: 0.72,
  },
  miniCover: {
    width: 58,
    height: 48,
    overflow: 'hidden',
    borderRadius: 9,
  },
  miniCoverGlow: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 999,
    opacity: 0.32,
    right: -16,
    top: -12,
  },
  miniCoverColumns: {
    position: 'absolute',
    left: 7,
    right: 7,
    top: 7,
    bottom: 7,
    flexDirection: 'row',
    gap: 3,
  },
  miniCoverColumn: {
    flex: 1,
    borderRadius: 4,
    opacity: 0.72,
  },
  cardBody: {
    gap: 10,
    paddingHorizontal: 11,
    paddingTop: 10,
    paddingBottom: 12,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 7,
    minWidth: 0,
  },
  cardName: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
  },
  cardTaskCount: {
    color: theme.colors.text2,
    fontSize: 12,
    lineHeight: 18,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 7,
  },
  cardTag: {
    overflow: 'hidden',
    maxWidth: 86,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 10,
  },
  cardDate: {
    color: theme.colors.text3,
    fontSize: 11,
  },
  newPlanCard: {
    minHeight: 136,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border2,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  newPlanIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: theme.colors.surface3,
  },
  newPlanCardLabel: {
    color: theme.colors.text2,
    fontSize: 13,
  },
  planList: {
    gap: 9,
  },
  planListRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 10,
    backgroundColor: theme.colors.surface1,
  },
  planListRowActive: {
    borderColor: theme.colors.focus,
    shadowColor: theme.colors.focus,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
  },
  planListBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  planListTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  planListName: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '500',
  },
  planListCount: {
    color: theme.colors.text2,
    fontSize: 12,
  },
  planListDescription: {
    color: theme.colors.text3,
    fontSize: 12,
  },
  planListMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newPlanListRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 13,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border2,
    borderRadius: 10,
  },
  newPlanListLabel: {
    color: theme.colors.text2,
    fontSize: 13,
  },
  emptyState: {
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 12,
    backgroundColor: theme.colors.surface2,
  },
  emptyStateTitle: {
    color: theme.colors.text2,
    fontSize: 14,
  },
  emptyStateBtn: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.text1,
  },
  emptyStateBtnText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  planSheetPreview: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 12,
    backgroundColor: theme.colors.surface1,
    marginBottom: 16,
  },
  planSheetPreviewBody: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 13,
  },
  planSheetPreviewName: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 16,
    fontWeight: '600',
  },
  planSheetLabel: {
    color: theme.colors.text2,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  planSheetInput: {
    minHeight: 46,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: theme.colors.text1,
    borderRadius: 9,
    backgroundColor: theme.colors.surface1,
    color: theme.colors.text1,
    fontSize: 15,
    marginBottom: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  planThemeRow: {
    gap: 9,
    paddingRight: 6,
    paddingBottom: 4,
  },
  planThemeOption: {
    position: 'relative',
    width: 94,
    minHeight: 86,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 10,
    backgroundColor: theme.colors.surface2,
  },
  planThemeOptionActive: {
    borderColor: theme.colors.text1,
    backgroundColor: theme.colors.surface1,
  },
  planThemeSwatch: {
    height: 42,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 3,
    padding: 5,
    borderRadius: 7,
    marginBottom: 8,
  },
  planThemeSwatchBar: {
    flex: 1,
    borderRadius: 4,
    opacity: 0.82,
  },
  planThemeLabel: {
    color: theme.colors.text1,
    fontSize: 12,
    fontWeight: '600',
  },
  planThemeCheck: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: theme.colors.text1,
  },
  planSheetSubmit: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: theme.colors.text1,
    marginTop: 16,
  },
  planSheetSubmitDisabled: {
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface3,
  },
  planSheetSubmitText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  planSheetSubmitTextDisabled: {
    color: theme.colors.text3,
  },
})
