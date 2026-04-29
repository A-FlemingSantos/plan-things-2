import { useCallback, useMemo, useRef, useState } from 'react'
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native'
import {
  Archive,
  ArrowDown,
  Check,
  Clock3,
  Code2,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderPlus,
  Grid2X2,
  Image,
  List,
  MoreHorizontal,
  Plus,
  Presentation,
  ScanLine,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  Upload,
  UsersRound,
} from 'lucide-react-native'
import { files } from '../data/demoData'
import { theme } from '../theme/tokens'

const fileIcons = {
  folder: Folder,
  pdf: FileText,
  doc: FileText,
  code: Code2,
  image: Image,
}

const fileSections = [
  { id: 'mine', label: 'Meus arquivos', icon: Folder },
  { id: 'shared', label: 'Compartilhado', icon: UsersRound },
  { id: 'recent', label: 'Recentes', icon: Clock3 },
  { id: 'favorites', label: 'Favoritos', icon: Star },
  { id: 'archived', label: 'Arquivados', icon: Archive },
  { id: 'trash', label: 'Lixeira', icon: Trash2 },
]

const viewOptions = [
  { id: 'list', label: 'Lista', icon: List },
  { id: 'grid', label: 'Bloco', icon: Grid2X2 },
]

const quickCreateOptions = [
  { id: 'folder', label: 'Pasta', icon: FolderPlus },
  { id: 'scan', label: 'Digitalizar', icon: ScanLine },
  { id: 'upload', label: 'Carregar', icon: Upload },
]

const documentCreateOptions = [
  { id: 'word', label: 'Documento do Word', icon: FileText },
  { id: 'powerpoint', label: 'Apresentação do PowerPoint', icon: Presentation },
  { id: 'excel', label: 'Planilha do Excel', icon: FileSpreadsheet },
]

export default function FilesScreen({ bottomOverlayOffset = 0 }) {
  const { width } = useWindowDimensions()
  const [query, setQuery] = useState('')
  const [activeSection, setActiveSection] = useState('mine')
  const [displayMode, setDisplayMode] = useState('list')
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [newItemSheetVisible, setNewItemSheetVisible] = useState(false)
  const [controlsCompact, setControlsCompactState] = useState(false)
  const compactProgress = useRef(new Animated.Value(0)).current
  const sheetProgress = useRef(new Animated.Value(0)).current
  const sheetDragY = useRef(new Animated.Value(0)).current
  const isCompact = useRef(false)
  const lastScrollY = useRef(0)
  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return files
    return files.filter((file) => file.name.toLowerCase().includes(normalized))
  }, [query])

  const setControlsCompact = useCallback((nextCompact) => {
    if (isCompact.current === nextCompact) return
    isCompact.current = nextCompact
    setControlsCompactState(nextCompact)
    Animated.timing(compactProgress, {
      toValue: nextCompact ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [compactProgress])

  const openNewItemSheet = useCallback(() => {
    sheetDragY.setValue(0)
    setNewItemSheetVisible(true)
    Animated.timing(sheetProgress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [sheetDragY, sheetProgress])

  const closeNewItemSheet = useCallback(() => {
    sheetDragY.setValue(0)
    Animated.timing(sheetProgress, {
      toValue: 0,
      duration: 210,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setNewItemSheetVisible(false)
    })
  }, [sheetDragY, sheetProgress])

  const sheetPanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
    onPanResponderMove: (_, gestureState) => {
      sheetDragY.setValue(Math.max(gestureState.dy, 0))
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 72 || gestureState.vy > 0.65) {
        closeNewItemSheet()
        return
      }

      Animated.spring(sheetDragY, {
        toValue: 0,
        damping: 18,
        stiffness: 190,
        mass: 0.7,
        useNativeDriver: true,
      }).start()
    },
  }), [closeNewItemSheet, sheetDragY])

  const handleScroll = useCallback((event) => {
    const nextY = Math.max(event.nativeEvent.contentOffset.y, 0)
    const delta = nextY - lastScrollY.current

    if (nextY > 14 && delta > 4) {
      setControlsCompact(true)
    } else if (delta < -4 || nextY <= 6) {
      setControlsCompact(false)
    }

    lastScrollY.current = nextY
  }, [setControlsCompact])

  const expandedRailWidth = Math.max(260, width - 68)
  const railWidth = compactProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [expandedRailWidth, 145],
  })
  const searchWidth = compactProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [expandedRailWidth - 72, 58],
  })
  const addMargin = compactProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  })
  const searchBackground = compactProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surface2, theme.colors.text1],
  })
  const railBackground = compactProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0)', theme.colors.text1],
  })
  const railShadowOpacity = compactProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.18],
  })
  const searchShadowOpacity = compactProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0],
  })
  const searchBorderColor = compactProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border1, theme.colors.text1],
  })
  const expandedOpacity = compactProgress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0, 0],
  })
  const compactOpacity = compactProgress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0, 0, 1],
  })
  const sheetTranslateY = Animated.add(
    sheetProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [560, 0],
    }),
    sheetDragY,
  ).interpolate({
    inputRange: [0, 560],
    outputRange: [0, 560],
    extrapolate: 'clamp',
  })
  const sheetOverlayOpacity = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.52],
  })

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Arquivos</Text>
          <Text style={styles.meta}>{filteredFiles.length} itens no workspace</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionTabs}
        >
          {fileSections.map((section) => {
            const SectionIcon = section.icon
            const isActive = activeSection === section.id
            return (
              <Pressable
                key={section.id}
                style={styles.sectionTab}
                onPress={() => setActiveSection(section.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <SectionIcon
                  size={23}
                  color={isActive ? theme.colors.text1 : theme.colors.text2}
                  strokeWidth={1.7}
                />
                <Text style={[styles.sectionLabel, isActive && styles.sectionLabelActive]} numberOfLines={1}>
                  {section.label}
                </Text>
                <View style={[styles.sectionIndicator, isActive && styles.sectionIndicatorActive]} />
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={styles.controlsWrap}>
          <View style={styles.controls}>
            <View style={styles.sort}>
              <ArrowDown size={17} color={theme.colors.text2} strokeWidth={1.8} />
              <Text style={styles.sortText}>Nome</Text>
            </View>
            <Pressable
              style={styles.filterButton}
              onPress={() => setViewMenuOpen((isOpen) => !isOpen)}
              accessibilityRole="button"
              accessibilityLabel="Filtrar arquivos"
              accessibilityState={{ expanded: viewMenuOpen }}
            >
              <SlidersHorizontal size={20} color={theme.colors.text2} strokeWidth={1.7} />
            </Pressable>
          </View>

          {viewMenuOpen ? (
            <View style={styles.viewMenu}>
              <Text style={styles.viewMenuTitle}>Exibir como:</Text>
              {viewOptions.map((option) => {
                const OptionIcon = option.icon
                const isSelected = displayMode === option.id
                return (
                  <Pressable
                    key={option.id}
                    style={styles.viewMenuOption}
                    onPress={() => {
                      setDisplayMode(option.id)
                      setViewMenuOpen(false)
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.viewMenuCheck}>
                      {isSelected ? <Check size={23} color={theme.colors.text2} strokeWidth={1.8} /> : null}
                    </View>
                    <Text style={[styles.viewMenuLabel, isSelected && styles.viewMenuLabelActive]}>
                      {option.label}
                    </Text>
                    <OptionIcon
                      size={27}
                      color={isSelected ? theme.colors.text1 : theme.colors.text2}
                      strokeWidth={1.7}
                    />
                  </Pressable>
                )
              })}
            </View>
          ) : null}
        </View>

        {displayMode === 'list' ? (
          <View style={styles.list}>
            {filteredFiles.map((file) => {
              const Icon = fileIcons[file.type] ?? FileText
              const iconColor = file.type === 'folder' ? theme.colors.text1 : theme.colors.text2
              return (
                <View key={file.id} style={styles.fileRow}>
                  <View style={styles.fileIcon}>
                    <Icon size={30} color={iconColor} strokeWidth={1.5} />
                  </View>
                  <View style={styles.fileBody}>
                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                    <Text style={styles.fileMeta} numberOfLines={1}>
                      {file.size || '0 KB'} · {file.modified}{file.shared ? ' · compartilhado' : ''}
                    </Text>
                  </View>
                  <Pressable style={styles.moreButton} accessibilityRole="button" accessibilityLabel={`Mais opções para ${file.name}`}>
                    <MoreHorizontal size={22} color={theme.colors.text2} strokeWidth={2} />
                  </Pressable>
                </View>
              )
            })}
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredFiles.map((file) => {
              const Icon = fileIcons[file.type] ?? FileText
              const iconColor = file.type === 'folder' ? theme.colors.text1 : theme.colors.text2
              return (
                <View key={file.id} style={styles.gridItem}>
                  <View style={styles.gridTop}>
                    <View style={styles.gridIcon}>
                      <Icon size={31} color={iconColor} strokeWidth={1.5} />
                    </View>
                    <Pressable style={styles.gridMoreButton} accessibilityRole="button" accessibilityLabel={`Mais opções para ${file.name}`}>
                      <MoreHorizontal size={21} color={theme.colors.text2} strokeWidth={2} />
                    </Pressable>
                  </View>
                  <Text style={styles.gridName} numberOfLines={2}>{file.name}</Text>
                  <Text style={styles.gridMeta} numberOfLines={1}>
                    {file.size || '0 KB'} · {file.modified}
                  </Text>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.floatingWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.floatingControls,
            {
              width: railWidth,
              backgroundColor: railBackground,
              shadowOpacity: railShadowOpacity,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.search,
              {
                width: searchWidth,
                backgroundColor: searchBackground,
                borderColor: searchBorderColor,
                shadowOpacity: searchShadowOpacity,
              },
            ]}
          >
            <Animated.View style={[styles.expandedSearchContent, { opacity: expandedOpacity }]}>
              <View style={styles.searchIconSlot}>
                <Search size={21} color={theme.colors.text1} strokeWidth={1.8} />
              </View>
              <View style={styles.searchInputWrap}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  style={styles.searchInput}
                  placeholder="Pesquisar seus arquivos"
                  placeholderTextColor={theme.colors.text2}
                  autoCapitalize="none"
                />
              </View>
            </Animated.View>
            <Pressable
              style={styles.compactSearchButton}
              onPress={() => setControlsCompact(false)}
              pointerEvents={controlsCompact ? 'auto' : 'none'}
              accessibilityRole="button"
              accessibilityLabel="Expandir busca"
            >
              <Animated.View style={{ opacity: compactOpacity }}>
                <Search size={25} color={theme.colors.white} strokeWidth={1.9} />
              </Animated.View>
            </Pressable>
          </Animated.View>
          <Animated.View style={[styles.compactDivider, { opacity: compactOpacity }]} />
          <Animated.View style={{ marginLeft: addMargin }}>
            <Pressable
              style={styles.addButton}
              onPress={openNewItemSheet}
              accessibilityRole="button"
              accessibilityLabel="Adicionar arquivo"
            >
              <Plus size={30} color={theme.colors.white} strokeWidth={1.7} />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>

      <View
        style={[styles.sheetLayer, { bottom: -bottomOverlayOffset }]}
        pointerEvents={newItemSheetVisible ? 'box-none' : 'none'}
      >
        <Animated.View style={[styles.sheetOverlay, { opacity: sheetOverlayOpacity }]}>
          <Pressable
            style={styles.sheetOverlayPress}
            onPress={closeNewItemSheet}
            accessibilityRole="button"
            accessibilityLabel="Fechar menu de adicionar"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.addSheet,
            {
              paddingBottom: 24 + bottomOverlayOffset,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          {...sheetPanResponder.panHandlers}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Adicionar novo</Text>

          <View style={styles.quickCreateGrid}>
            {quickCreateOptions.map((option) => {
              const OptionIcon = option.icon
              return (
                <Pressable
                  key={option.id}
                  style={styles.quickCreateButton}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                >
                  <OptionIcon size={24} color={theme.colors.text1} strokeWidth={1.55} />
                  <Text style={styles.quickCreateLabel}>{option.label}</Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.documentCreateList}>
            {documentCreateOptions.map((option) => {
              const OptionIcon = option.icon
              return (
                <Pressable
                  key={option.id}
                  style={styles.documentCreateRow}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                >
                  <View style={styles.documentCreateIcon}>
                    <OptionIcon size={18} color={theme.colors.text1} strokeWidth={1.55} />
                  </View>
                  <Text style={styles.documentCreateLabel}>{option.label}</Text>
                </Pressable>
              )
            })}
          </View>
        </Animated.View>
      </View>
    </View>
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
    paddingBottom: 220,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    color: theme.colors.text1,
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 38,
  },
  meta: {
    color: theme.colors.text3,
    fontSize: 13,
    marginTop: 2,
  },
  sectionTabs: {
    gap: 24,
    paddingRight: 24,
    paddingBottom: 16,
  },
  sectionTab: {
    width: 112,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  sectionLabel: {
    color: theme.colors.text2,
    fontSize: 15,
    lineHeight: 18,
  },
  sectionLabelActive: {
    color: theme.colors.text1,
    fontWeight: '600',
  },
  sectionIndicator: {
    width: 76,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  sectionIndicatorActive: {
    backgroundColor: theme.colors.text1,
  },
  controlsWrap: {
    position: 'relative',
    zIndex: 3,
    marginBottom: 18,
  },
  controls: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sortText: {
    color: theme.colors.text2,
    fontSize: 21,
    fontWeight: '400',
  },
  filterButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    outlineStyle: 'none',
  },
  viewMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    width: 222,
    paddingTop: 18,
    paddingRight: 18,
    paddingBottom: 14,
    paddingLeft: 18,
    borderRadius: 8,
    backgroundColor: theme.colors.surface1,
    shadowColor: theme.colors.black,
    shadowOpacity: 0.13,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  viewMenuTitle: {
    color: theme.colors.text1,
    fontSize: 17,
    marginBottom: 13,
  },
  viewMenuOption: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    outlineStyle: 'none',
  },
  viewMenuCheck: {
    width: 27,
    alignItems: 'center',
  },
  viewMenuLabel: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 18,
  },
  viewMenuLabelActive: {
    fontWeight: '500',
  },
  floatingWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: 'center',
  },
  floatingControls: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    shadowColor: theme.colors.black,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
  },
  search: {
    height: 58,
    paddingHorizontal: 18,
    borderRadius: 29,
    borderWidth: 1,
    outlineStyle: 'none',
    shadowColor: theme.colors.black,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  expandedSearchContent: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  searchIconSlot: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactSearchButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    outlineStyle: 'none',
  },
  searchInputWrap: {
    flex: 1,
    minWidth: 0,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 16,
    outlineStyle: 'none',
  },
  list: {
    gap: 2,
    zIndex: 1,
  },
  fileRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fileIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  fileBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  fileName: {
    color: theme.colors.text1,
    fontSize: 19,
    fontWeight: '400',
  },
  fileMeta: {
    color: theme.colors.text2,
    fontSize: 14,
  },
  moreButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDivider: {
    width: 1,
    height: 28,
    marginLeft: -1,
    backgroundColor: theme.colors.gray600,
  },
  addButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text1,
    outlineStyle: 'none',
  },
  sheetLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.black,
  },
  sheetOverlayPress: {
    flex: 1,
  },
  addSheet: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingTop: 14,
    paddingRight: 26,
    paddingBottom: 24,
    paddingLeft: 26,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: theme.colors.surface1,
    shadowColor: theme.colors.black,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -5 },
    elevation: 14,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 999,
    backgroundColor: theme.colors.gray600,
  },
  sheetTitle: {
    color: theme.colors.text1,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 22,
  },
  quickCreateGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickCreateButton: {
    flex: 1,
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 8,
    backgroundColor: theme.colors.surface2,
    outlineStyle: 'none',
  },
  quickCreateLabel: {
    color: theme.colors.text1,
    fontSize: 13,
    lineHeight: 17,
  },
  documentCreateList: {
    gap: 12,
  },
  documentCreateRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    outlineStyle: 'none',
  },
  documentCreateIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  documentCreateLabel: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 18,
    lineHeight: 23,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    zIndex: 1,
  },
  gridItem: {
    width: '48%',
    minHeight: 138,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
  },
  gridTop: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  gridIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface1,
  },
  gridMoreButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridName: {
    color: theme.colors.text1,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '500',
    minHeight: 38,
  },
  gridMeta: {
    color: theme.colors.text2,
    fontSize: 12,
    marginTop: 6,
  },
})
