import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Image as ImageIcon,
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
import BottomSheet from '../components/BottomSheet'
import { theme } from '../theme/tokens'

const fileIcons = {
  folder: Folder,
  pdf: FileText,
  doc: FileText,
  code: Code2,
  image: ImageIcon,
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

function SolidFileIcon({ type = 'doc', size }) {
  const Icon = fileIcons[type] ?? FileText
  return (
    <View style={[styles.fileIconTile, { width: size, height: size, borderRadius: Math.max(7, size * 0.22) }]}>
      <Icon size={Math.round(size * 0.58)} color={theme.colors.white} strokeWidth={2.05} />
    </View>
  )
}

export default function FilesScreen({ bottomOverlayOffset = 0 }) {
  const { width } = useWindowDimensions()
  const [localFiles, setLocalFiles] = useState(() => files.map((file) => ({ ...file, section: 'mine' })))
  const [query, setQuery] = useState('')
  const [activeSection, setActiveSection] = useState('mine')
  const [displayMode, setDisplayMode] = useState('list')
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [newItemSheetVisible, setNewItemSheetVisible] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState(null)
  const [fileSheetMode, setFileSheetMode] = useState('menu')
  const [renameValue, setRenameValue] = useState('')
  const [createFlow, setCreateFlow] = useState(null)
  const [controlsCompact, setControlsCompactState] = useState(false)
  const compactProgress = useRef(new Animated.Value(0)).current
  const sheetProgress = useRef(new Animated.Value(0)).current
  const sheetDragY = useRef(new Animated.Value(0)).current
  const scrollRef = useRef(null)
  const isCompact = useRef(false)
  const lastScrollY = useRef(0)
  const selectedFile = localFiles.find((file) => file.id === selectedFileId) ?? null
  const CreateFlowIcon = createFlow?.icon
  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const sectionFiles = localFiles.filter((file) => {
      if (activeSection === 'trash') return file.trashed
      if (file.trashed) return false
      if (activeSection === 'archived') return file.archived
      if (file.archived) return false
      if (activeSection === 'shared') return file.shared
      if (activeSection === 'favorites') return file.favorite
      return true
    })

    if (!normalized) return sectionFiles
    return sectionFiles.filter((file) => file.name.toLowerCase().includes(normalized))
  }, [activeSection, localFiles, query])

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
    setViewMenuOpen(false)
    setCreateFlow(null)
    sheetDragY.setValue(0)
    setNewItemSheetVisible(true)
    Animated.timing(sheetProgress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [sheetDragY, sheetProgress])

  const openCreateFlow = useCallback((option) => {
    sheetProgress.stopAnimation()
    sheetProgress.setValue(0)
    sheetDragY.setValue(0)
    setNewItemSheetVisible(false)
    setCreateFlow(option)
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

  useEffect(() => {
    lastScrollY.current = 0
    isCompact.current = false
    setControlsCompactState(false)
    compactProgress.setValue(0)
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [compactProgress])

  const openFileMenu = (file) => {
    setSelectedFileId(file.id)
    setRenameValue(file.name)
    setFileSheetMode('menu')
  }

  const closeFileSheet = () => {
    setSelectedFileId(null)
    setFileSheetMode('menu')
  }

  const updateSelectedFile = (patch) => {
    if (!selectedFileId) return
    setLocalFiles((currentFiles) => currentFiles.map((file) => (
      file.id === selectedFileId ? { ...file, ...patch } : file
    )))
  }

  const renameSelectedFile = () => {
    const name = renameValue.trim()
    if (!name) return
    updateSelectedFile({ name, modified: 'agora' })
    closeFileSheet()
  }

  const moveSelectedFile = (section) => {
    const patch = section === 'shared'
      ? { shared: true, section: 'shared', modified: 'agora' }
      : { section, archived: section === 'archived', favorite: section === 'favorites', modified: 'agora' }

    updateSelectedFile(patch)
    closeFileSheet()
  }

  const deleteSelectedFile = () => {
    updateSelectedFile({ trashed: true, archived: false, modified: 'agora' })
    closeFileSheet()
  }

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
        ref={scrollRef}
        style={styles.scroller}
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
          style={styles.sectionTabsScroller}
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
                  fill="none"
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
              style={[styles.filterButton, viewMenuOpen && styles.filterButtonActive]}
              onPress={() => setViewMenuOpen((isOpen) => !isOpen)}
              accessibilityRole="button"
              accessibilityLabel="Filtrar arquivos"
              accessibilityState={{ expanded: viewMenuOpen }}
            >
              <SlidersHorizontal size={20} color={viewMenuOpen ? theme.colors.text1 : theme.colors.text2} strokeWidth={1.7} />
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
                    style={[styles.viewMenuOption, isSelected && styles.viewMenuOptionActive]}
                    onPress={() => {
                      setDisplayMode(option.id)
                      setViewMenuOpen(false)
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.viewMenuCheck}>
                      {isSelected ? <Check size={23} color={theme.colors.text1} strokeWidth={1.8} /> : null}
                    </View>
                    <Text style={[styles.viewMenuLabel, isSelected && styles.viewMenuLabelActive]}>
                      {option.label}
                    </Text>
                    <OptionIcon
                      size={27}
                      color={isSelected ? theme.colors.text1 : theme.colors.text2}
                      fill="none"
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
              return (
                <View key={file.id} style={styles.fileRow}>
                  <View style={styles.fileIcon}>
                    <SolidFileIcon type={file.type} size={33} />
                  </View>
                  <View style={styles.fileBody}>
                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                    <View style={styles.fileMetaRow}>
                      <Text style={styles.fileMeta} numberOfLines={1}>
                        {file.size || '0 KB'} · {file.modified}
                      </Text>
                      {file.shared ? (
                        <View style={styles.sharedBadge}>
                          <Text style={styles.sharedBadgeText}>compartilhado</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <Pressable
                    style={styles.moreButton}
                    onPress={() => openFileMenu(file)}
                    accessibilityRole="button"
                    accessibilityLabel={`Mais opções para ${file.name}`}
                  >
                    <MoreHorizontal size={22} color={theme.colors.text2} strokeWidth={2} />
                  </Pressable>
                </View>
              )
            })}
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredFiles.map((file) => {
              return (
                <View key={file.id} style={styles.gridItem}>
                  <View style={styles.gridTop}>
                    <View style={styles.gridIcon}>
                      <SolidFileIcon type={file.type} size={32} />
                    </View>
                    <Pressable
                      style={styles.gridMoreButton}
                      onPress={() => openFileMenu(file)}
                      accessibilityRole="button"
                      accessibilityLabel={`Mais opções para ${file.name}`}
                    >
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
              paddingBottom: 2 + bottomOverlayOffset,
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
                  onPress={() => openCreateFlow(option)}
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
                  onPress={() => openCreateFlow(option)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                >
                  <View style={styles.documentCreateIcon}>
                    <OptionIcon size={18} color={theme.colors.white} fill={theme.colors.text1} strokeWidth={1.55} />
                  </View>
                  <Text style={styles.documentCreateLabel}>{option.label}</Text>
                </Pressable>
              )
            })}
          </View>
        </Animated.View>
      </View>

      <BottomSheet visible={Boolean(selectedFile)} onClose={closeFileSheet} title={fileSheetMode === 'menu' ? selectedFile?.name : fileSheetMode === 'rename' ? 'Renomear' : 'Mover para'}>
        {fileSheetMode === 'menu' ? (
          <View style={styles.fileActionList}>
            <View style={styles.fileActionMeta}>
              <SolidFileIcon type={selectedFile?.type} size={36} />
              <View style={styles.fileActionMetaBody}>
                <Text style={styles.fileActionTitle} numberOfLines={1}>{selectedFile?.name}</Text>
                <Text style={styles.fileActionSubtitle}>{selectedFile?.size || '0 KB'} · {selectedFile?.modified}</Text>
              </View>
            </View>

            <Pressable style={styles.fileActionRow} onPress={() => setFileSheetMode('details')} accessibilityRole="button">
              <FileText size={18} color={theme.colors.text1} strokeWidth={1.8} />
              <Text style={styles.fileActionLabel}>Abrir detalhes</Text>
            </Pressable>
            <Pressable style={styles.fileActionRow} onPress={() => setFileSheetMode('rename')} accessibilityRole="button">
              <Text style={styles.fileActionIconText}>Aa</Text>
              <Text style={styles.fileActionLabel}>Renomear</Text>
            </Pressable>
            <Pressable
              style={styles.fileActionRow}
              onPress={() => {
                updateSelectedFile({ shared: true, modified: 'agora' })
                closeFileSheet()
              }}
              accessibilityRole="button"
            >
              <UsersRound size={18} color={theme.colors.text1} strokeWidth={1.8} />
              <Text style={styles.fileActionLabel}>Compartilhar</Text>
            </Pressable>
            <Pressable style={styles.fileActionRow} onPress={() => setFileSheetMode('move')} accessibilityRole="button">
              <Folder size={18} color={theme.colors.text1} strokeWidth={1.8} />
              <Text style={styles.fileActionLabel}>Mover</Text>
            </Pressable>
            <Pressable style={[styles.fileActionRow, styles.fileActionDanger]} onPress={deleteSelectedFile} accessibilityRole="button">
              <Trash2 size={18} color={theme.colors.red} strokeWidth={1.8} />
              <Text style={[styles.fileActionLabel, styles.fileActionDangerText]}>Excluir</Text>
            </Pressable>
          </View>
        ) : null}

        {fileSheetMode === 'details' ? (
          <View style={styles.fileDetails}>
            <Text style={styles.fileDetailsLabel}>Nome</Text>
            <Text style={styles.fileDetailsValue}>{selectedFile?.name}</Text>
            <Text style={styles.fileDetailsLabel}>Tipo</Text>
            <Text style={styles.fileDetailsValue}>{selectedFile?.type === 'folder' ? 'Pasta' : 'Arquivo'}</Text>
            <Text style={styles.fileDetailsLabel}>Compartilhamento</Text>
            <Text style={styles.fileDetailsValue}>{selectedFile?.shared ? 'Compartilhado' : 'Privado'}</Text>
          </View>
        ) : null}

        {fileSheetMode === 'rename' ? (
          <View>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              style={styles.fileRenameInput}
              selectionColor={theme.colors.text1}
              autoCorrect={false}
            />
            <Pressable
              style={[styles.filePrimaryButton, !renameValue.trim() && styles.filePrimaryButtonDisabled]}
              onPress={renameSelectedFile}
              disabled={!renameValue.trim()}
              accessibilityRole="button"
              accessibilityState={{ disabled: !renameValue.trim() }}
            >
              <Text style={[styles.filePrimaryButtonText, !renameValue.trim() && styles.filePrimaryButtonTextDisabled]}>Salvar nome</Text>
            </Pressable>
          </View>
        ) : null}

        {fileSheetMode === 'move' ? (
          <View style={styles.fileActionList}>
            {[
              { id: 'mine', label: 'Meus arquivos', icon: Folder },
              { id: 'shared', label: 'Compartilhado', icon: UsersRound },
              { id: 'favorites', label: 'Favoritos', icon: Star },
              { id: 'archived', label: 'Arquivados', icon: Archive },
            ].map((target) => {
              const TargetIcon = target.icon
              return (
                <Pressable key={target.id} style={styles.fileActionRow} onPress={() => moveSelectedFile(target.id)} accessibilityRole="button">
                  <TargetIcon size={18} color={theme.colors.text1} strokeWidth={1.8} />
                  <Text style={styles.fileActionLabel}>{target.label}</Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet visible={Boolean(createFlow)} onClose={() => setCreateFlow(null)} title={createFlow ? createFlow.label : ''}>
        <View style={styles.createFlowPanel}>
          {createFlow ? (
            <>
              <View style={styles.createFlowIcon}>
                {CreateFlowIcon ? <CreateFlowIcon size={23} color={theme.colors.text1} strokeWidth={1.7} /> : null}
              </View>
              <Text style={styles.createFlowTitle}>{createFlow.label}</Text>
              <Text style={styles.createFlowText}>
                {createFlow.id === 'folder'
                  ? 'Informe os dados da pasta antes de criar no workspace.'
                  : createFlow.id === 'scan' || createFlow.id === 'upload'
                    ? 'Este seletor fica pronto para conectar o recurso nativo do dispositivo.'
                    : 'Configure o documento antes de adicionar ao workspace.'}
              </Text>
              <TextInput
                style={styles.createFlowInput}
                placeholder={createFlow.id === 'folder' ? 'Nome da pasta' : 'Nome do item'}
                placeholderTextColor={theme.colors.text3}
                selectionColor={theme.colors.text1}
              />
              <Pressable style={styles.filePrimaryButton} onPress={() => setCreateFlow(null)} accessibilityRole="button">
                <Text style={styles.filePrimaryButtonText}>Concluir</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </BottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  scroller: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 20,
    paddingBottom: 104,
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
  sectionTabsScroller: {
    height: 88,
    flexGrow: 0,
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
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    outlineStyle: 'none',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.surface3,
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
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
    outlineStyle: 'none',
  },
  viewMenuOptionActive: {
    backgroundColor: theme.colors.surface3,
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
    alignItems: 'center',
    justifyContent: 'center',
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
  fileMetaRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sharedBadge: {
    flexShrink: 0,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: theme.colors.surface3,
  },
  sharedBadgeText: {
    color: theme.colors.text1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
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
    paddingTop: 10,
    paddingRight: 26,
    paddingBottom: 2,
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
    marginBottom: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.gray600,
  },
  sheetTitle: {
    color: theme.colors.text1,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 12,
  },
  quickCreateGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickCreateButton: {
    flex: 1,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
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
    gap: 18,
  },
  documentCreateRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    outlineStyle: 'none',
  },
  documentCreateIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  fileIconTile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text1,
  },
  documentCreateLabel: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 17,
    lineHeight: 21,
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
    alignItems: 'center',
    justifyContent: 'center',
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
  fileActionList: {
    gap: 8,
  },
  fileActionMeta: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 12,
    backgroundColor: theme.colors.surface2,
    marginBottom: 4,
  },
  fileActionMetaBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  fileActionTitle: {
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '600',
  },
  fileActionSubtitle: {
    color: theme.colors.text2,
    fontSize: 12,
  },
  fileActionRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.surface2,
    outlineStyle: 'none',
  },
  fileActionIconText: {
    width: 18,
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  fileActionLabel: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '500',
  },
  fileActionDanger: {
    backgroundColor: '#fff0f0',
  },
  fileActionDangerText: {
    color: theme.colors.red,
  },
  fileDetails: {
    gap: 5,
  },
  fileDetailsLabel: {
    color: theme.colors.text3,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  fileDetailsValue: {
    color: theme.colors.text1,
    fontSize: 16,
  },
  fileRenameInput: {
    minHeight: 46,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: theme.colors.text1,
    borderRadius: 9,
    color: theme.colors.text1,
    fontSize: 15,
    marginBottom: 12,
    outlineStyle: 'none',
  },
  filePrimaryButton: {
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: theme.colors.text1,
  },
  filePrimaryButtonDisabled: {
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface3,
  },
  filePrimaryButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  filePrimaryButtonTextDisabled: {
    color: theme.colors.text3,
  },
  createFlowPanel: {
    alignItems: 'center',
  },
  createFlowIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surface2,
    marginBottom: 10,
  },
  createFlowTitle: {
    color: theme.colors.text1,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  createFlowText: {
    color: theme.colors.text2,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  createFlowInput: {
    alignSelf: 'stretch',
    minHeight: 46,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 9,
    color: theme.colors.text1,
    fontSize: 15,
    marginBottom: 12,
    outlineStyle: 'none',
  },
})
