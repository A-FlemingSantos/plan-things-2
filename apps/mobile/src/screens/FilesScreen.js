import { useCallback, useMemo, useRef, useState } from 'react'
import { Animated, Easing, FlatList, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { getFileSizeBytes, getFileTimestamp } from '@plan-things/shared-client/files'
import {
  ArrowDown,
  ArrowDownUp,
  Check,
  Clock3,
  Code2,
  Download,
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
  Star,
  Trash2,
  Upload,
  UsersRound,
  X,
} from 'lucide-react-native'
import { interactivePointerEventsStyle, resolveInteractivePointerEventsStyle, shouldUseNativeDriver, withPlatformPointerEvents } from '../theme/platformRuntime'
import BottomSheet from '../components/BottomSheet'
import { useFiles } from '../providers/FilesProvider'
import { usePlans } from '../providers/PlansProvider'
import { theme } from '../theme/tokens'
import { useThemedStyles } from '../theme/ThemeProvider'

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
  { id: 'trash', label: 'Lixeira', icon: Trash2 },
]

const quickCreateOptions = [
  { id: 'folder', label: 'Pasta', icon: FolderPlus },
  { id: 'scan', label: 'Digitalizar', icon: ScanLine, disabled: true },
  { id: 'upload', label: 'Carregar', icon: Upload },
]

const documentCreateOptions = [
  { id: 'word', label: 'Documento do Word', icon: FileText, disabled: true },
  { id: 'powerpoint', label: 'Apresentação do PowerPoint', icon: Presentation, disabled: true },
  { id: 'excel', label: 'Planilha do Excel', icon: FileSpreadsheet, disabled: true },
]

function SolidFileIcon({ type = 'doc', size, variant = 'tile' }) {
  const Icon = fileIcons[type] ?? FileText

  if (variant === 'plain') {
    return <Icon size={size} color={theme.colors.text1} strokeWidth={2.1} />
  }

  return (
    <View
      style={[
        styles.fileIconTile,
        {
          width: size,
          height: size,
          borderRadius: Math.max(theme.radius.sm, size * 0.22),
        },
      ]}
    >
      <Icon size={Math.round(size * 0.58)} color={theme.colors.text1} strokeWidth={2.1} />
    </View>
  )
}

export default function FilesScreen({ bottomOverlayOffset = 0 }) {
  styles = useThemedStyles(createStyles)
  const {
    files: localFiles,
    createFolder,
    uploadFile,
    downloadFile,
    toggleFavorite,
    trashFile,
    restoreFile,
    shareToPlan,
    unshareFromPlan,
  } = useFiles()
  const { plans } = usePlans()
  const [query, setQuery] = useState('')
  const [activeSection, setActiveSection] = useState('mine')
  const [displayMode, setDisplayMode] = useState('list')
  const [sortSheetOpen, setSortSheetOpen] = useState(false)
  const [sortKey, setSortKey] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [newItemSheetVisible, setNewItemSheetVisible] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState(null)
  const [fileSheetMode, setFileSheetMode] = useState('menu')
  const [fileError, setFileError] = useState(null)
  const [createFlow, setCreateFlow] = useState(null)
  const [createName, setCreateName] = useState('')
  const sheetProgress = useRef(new Animated.Value(0)).current
  const sheetDragY = useRef(new Animated.Value(0)).current
  const selectedFile = localFiles.find((file) => file.id === selectedFileId) ?? null
  const CreateFlowIcon = createFlow?.icon
  const activeSectionLabel = fileSections.find((section) => section.id === activeSection)?.label ?? 'Arquivos'
  const sheetInteractiveStyle = resolveInteractivePointerEventsStyle(newItemSheetVisible)

  const sectionCounts = useMemo(() => {
    const counts = {
      mine: 0,
      shared: 0,
      recent: 0,
      favorites: 0,
      trash: 0,
    }

    for (const file of localFiles) {
      if (file.trashed) {
        counts.trash += 1
        continue
      }

      counts.recent += 1
      if (file.favorite) counts.favorites += 1
      if (file.shared) counts.shared += 1
      if ((file.section ?? 'mine') === 'mine') counts.mine += 1
    }

    return counts
  }, [localFiles])

  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const sectionFiles = localFiles.filter((file) => {
      if (activeSection === 'trash') return Boolean(file.trashed)
      if (file.trashed) return false

      if (activeSection === 'favorites') return Boolean(file.favorite)
      if (activeSection === 'shared') return Boolean(file.shared)
      if (activeSection === 'mine') return (file.section ?? 'mine') === 'mine'
      if (activeSection === 'recent') return true
      return true
    })

    const searched = normalized
      ? sectionFiles.filter((file) => file.name.toLowerCase().includes(normalized))
      : sectionFiles

    const effectiveSortKey = activeSection === 'recent' ? 'modified' : sortKey
    const effectiveDirection = activeSection === 'recent' ? 'desc' : sortDirection

    const sorted = [...searched].sort((a, b) => {
      if (effectiveSortKey === 'size') {
        return getFileSizeBytes(a) - getFileSizeBytes(b)
      }
      if (effectiveSortKey === 'modified') {
        return getFileTimestamp(a) - getFileTimestamp(b)
      }
      return String(a.name).localeCompare(String(b.name), 'pt-BR', { sensitivity: 'base' })
    })

    return effectiveDirection === 'desc' ? sorted.reverse() : sorted
  }, [activeSection, localFiles, query, sortDirection, sortKey])

  const openNewItemSheet = useCallback(() => {
    setCreateFlow(null)
    sheetDragY.setValue(0)
    setNewItemSheetVisible(true)
    Animated.timing(sheetProgress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: shouldUseNativeDriver,
    }).start()
  }, [sheetDragY, sheetProgress])

  const openCreateFlow = useCallback((option) => {
    if (option.disabled) return
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
      useNativeDriver: shouldUseNativeDriver,
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
        useNativeDriver: shouldUseNativeDriver,
      }).start()
    },
  }), [closeNewItemSheet, sheetDragY])

  const openFileMenu = (file) => {
    setSelectedFileId(file.id)
    setFileError(null)
    setFileSheetMode('menu')
  }

  const closeFileSheet = () => {
    setSelectedFileId(null)
    setFileSheetMode('menu')
    setFileError(null)
  }

  const updateSelectedFile = (patch) => {
    if (!selectedFileId || !selectedFile) return
    if (patch.favorite !== undefined) {
      void toggleFavorite(selectedFile)
    }
    if (patch.shared !== undefined) {
      const firstPlanId = plans[0]?.id
      if (patch.shared) {
        void shareToPlan(selectedFileId, firstPlanId)
      } else {
        void unshareFromPlan(selectedFileId, firstPlanId)
      }
    }
    if (patch.trashed) {
      void trashFile(selectedFileId)
    }
  }

  const deleteSelectedFile = () => {
    if (selectedFile?.trashed) {
      void restoreFile(selectedFile.id)
    } else {
      updateSelectedFile({ trashed: true })
    }
    closeFileSheet()
  }

  const downloadSelectedFile = async () => {
    if (!selectedFile || selectedFile.type === 'folder') return
    setFileError(null)
    try {
      await downloadFile(selectedFile)
      closeFileSheet()
    } catch (error) {
      setFileError(error?.message ?? 'Nao foi possivel baixar o arquivo.')
    }
  }

  const submitCreateFlow = async () => {
    if (!createFlow) return
    const name = createName.trim() || createFlow.label
    if (createFlow.id === 'folder') {
      await createFolder(name)
    } else if (createFlow.id === 'upload') {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
      const asset = result.assets?.[0]
      if (asset) {
        await uploadFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? 'application/octet-stream',
        })
      }
    }
    setCreateName('')
    setCreateFlow(null)
  }

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
      <FlatList
        key={displayMode}
        style={styles.scroller}
        contentContainerStyle={styles.content}
        data={filteredFiles}
        keyExtractor={(file) => String(file.id)}
        numColumns={displayMode === 'grid' ? 2 : 1}
        columnWrapperStyle={displayMode === 'grid' ? styles.gridRow : undefined}
        renderItem={({ item: file, index }) => {
          if (displayMode === 'list') {
            return (
              <View style={[styles.fileRow, index === 0 && styles.fileRowFirst]}>
                <View style={styles.fileIcon}>
                  <SolidFileIcon type={file.type} size={40} />
                </View>
                <View style={styles.fileBody}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  <View style={styles.fileMetaRow}>
                    <Text style={styles.fileMeta} numberOfLines={1}>
                      {file.sizeLabel || file.size || '0 KB'} · {file.modified}
                    </Text>
                    {file.shared ? (
                      <Text style={styles.sharedBadgeText}>compartilhado</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.fileActions}>
                  <Pressable
                    style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
                    onPress={() => toggleFavorite(file)}
                    accessibilityRole="button"
                    accessibilityLabel={file.favorite ? `Remover ${file.name} dos favoritos` : `Favoritar ${file.name}`}
                  >
                    <Star size={17} color={file.favorite ? theme.colors.amber : theme.colors.text3} strokeWidth={1.9} />
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
                    onPress={() => openFileMenu(file)}
                    accessibilityRole="button"
                    accessibilityLabel={`Mais opções para ${file.name}`}
                  >
                    <MoreHorizontal size={18} color={theme.colors.text2} strokeWidth={2} />
                  </Pressable>
                </View>
              </View>
            )
          }

          return (
            <View style={styles.gridItem}>
              <View style={styles.gridHero}>
                <SolidFileIcon type={file.type} size={52} variant="plain" />
                <View style={styles.gridHeroActions}>
                  <Pressable
                    style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
                    onPress={() => toggleFavorite(file)}
                    accessibilityRole="button"
                    accessibilityLabel={file.favorite ? `Remover ${file.name} dos favoritos` : `Favoritar ${file.name}`}
                  >
                    <Star size={17} color={file.favorite ? theme.colors.amber : theme.colors.text3} strokeWidth={1.9} />
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
                    onPress={() => openFileMenu(file)}
                    accessibilityRole="button"
                    accessibilityLabel={`Mais opções para ${file.name}`}
                  >
                    <MoreHorizontal size={18} color={theme.colors.text2} strokeWidth={2} />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.gridName} numberOfLines={2}>{file.name}</Text>
              <Text style={styles.gridMeta} numberOfLines={1}>
                {file.sizeLabel || file.size || '0 KB'} · {file.modified}
              </Text>
            </View>
          )
        }}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Folder size={18} color={theme.colors.text3} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>Nada por aqui</Text>
            <Text style={styles.emptyHint}>
              {query ? 'Tente buscar por outro termo.' : 'Envie arquivos, crie pastas e organize sua biblioteca.'}
            </Text>
          </View>
        )}
        ListHeaderComponent={(
          <View>
            <View style={styles.topbar}>
              <View style={styles.topbarText}>
                <Text style={styles.pageEyebrow}>{activeSectionLabel.toUpperCase()}</Text>
                <Text style={styles.pageTitle} numberOfLines={1}>Arquivos</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                onPress={() => setSortSheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Ordenar arquivos"
              >
                <ArrowDownUp size={17} color={theme.colors.text1} strokeWidth={1.9} />
              </Pressable>
            </View>

            <View style={styles.searchBar}>
              <View style={styles.searchWrap}>
                <Search size={16} color={theme.colors.text3} strokeWidth={1.8} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar na biblioteca..."
                  placeholderTextColor={theme.colors.text3}
                  style={styles.searchInput}
                  selectionColor={theme.colors.text1}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {query ? (
                  <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Limpar busca">
                    <X size={15} color={theme.colors.text3} strokeWidth={1.8} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
                onPress={openNewItemSheet}
                accessibilityRole="button"
                accessibilityLabel="Adicionar arquivo"
              >
                <Plus size={19} color={theme.colors.textInverse} strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              style={styles.sectionChipsScroller}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sectionChips}
            >
              {fileSections.map((section) => {
                const SectionIcon = section.icon
                const isActive = activeSection === section.id
                const count = sectionCounts[section.id] ?? 0
                return (
                  <Pressable
                    key={section.id}
                    style={({ pressed }) => [
                      styles.sectionChip,
                      isActive && styles.sectionChipActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setActiveSection(section.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <SectionIcon size={14} color={isActive ? theme.colors.text1 : theme.colors.text3} strokeWidth={1.9} />
                    <Text style={[styles.sectionChipLabel, isActive && styles.sectionChipLabelActive]} numberOfLines={1}>
                      {section.label}
                    </Text>
                    <Text style={[styles.sectionChipCount, isActive && styles.sectionChipCountActive]}>{count}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>

            <View style={styles.toolbar}>
              <View style={styles.sectionMeta}>
                <Text style={styles.sectionMetaCount}>{filteredFiles.length}</Text>
                <Text style={styles.sectionMetaLabel}>itens</Text>
              </View>

              <View style={styles.toolbarRight}>
                <View style={styles.viewToggle}>
                  <Pressable
                    style={[styles.viewToggleBtn, displayMode === 'grid' && styles.viewToggleBtnActive]}
                    onPress={() => setDisplayMode('grid')}
                    accessibilityRole="button"
                    accessibilityLabel="Visualizacao em grade"
                  >
                    <Grid2X2 size={16} color={displayMode === 'grid' ? theme.colors.text1 : theme.colors.text3} strokeWidth={1.8} />
                  </Pressable>
                  <Pressable
                    style={[styles.viewToggleBtn, displayMode === 'list' && styles.viewToggleBtnActive]}
                    onPress={() => setDisplayMode('list')}
                    accessibilityRole="button"
                    accessibilityLabel="Visualizacao em lista"
                  >
                    <List size={16} color={displayMode === 'list' ? theme.colors.text1 : theme.colors.text3} strokeWidth={1.8} />
                  </Pressable>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
                  onPress={() => setSortSheetOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir opções de ordenação"
                >
                  <Text style={styles.sortButtonText} numberOfLines={1}>
                    {activeSection === 'recent' ? 'Modificado' : sortKey === 'modified' ? 'Modificado' : sortKey === 'size' ? 'Tamanho' : 'Nome'}
                  </Text>
                  <ArrowDown size={15} color={theme.colors.text3} strokeWidth={1.8} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      <View
        {...withPlatformPointerEvents(
          [styles.sheetLayer, { bottom: -bottomOverlayOffset }],
          newItemSheetVisible ? 'box-none' : 'none',
        )}
      >
        <Animated.View style={[styles.sheetOverlay, sheetInteractiveStyle, { opacity: sheetOverlayOpacity }]}>
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
            sheetInteractiveStyle,
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
                  style={({ pressed }) => [
                    styles.quickCreateButton,
                    option.disabled && styles.quickCreateButtonDisabled,
                    pressed && !option.disabled && styles.pressed,
                  ]}
                  onPress={() => openCreateFlow(option)}
                  disabled={option.disabled}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: Boolean(option.disabled) }}
                  accessibilityLabel={option.label}
                >
                  <OptionIcon size={22} color={option.disabled ? theme.colors.text3 : theme.colors.text1} strokeWidth={1.55} />
                  <Text style={[styles.quickCreateLabel, option.disabled && styles.quickCreateLabelDisabled]}>{option.label}</Text>
                  {option.disabled ? <Text style={styles.comingSoonText}>Em breve</Text> : null}
                </Pressable>
              )
            })}
          </View>

          <View style={styles.documentCreateList}>
            {documentCreateOptions.map((option, index) => {
              const OptionIcon = option.icon
              const isLast = index === documentCreateOptions.length - 1
              return (
                <Pressable
                  key={option.id}
                  style={({ pressed }) => [
                    styles.documentCreateRow,
                    !isLast && styles.documentCreateRowBorder,
                    option.disabled && styles.documentCreateRowDisabled,
                    pressed && !option.disabled && styles.pressed,
                  ]}
                  onPress={() => openCreateFlow(option)}
                  disabled={option.disabled}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: Boolean(option.disabled) }}
                  accessibilityLabel={option.label}
                >
                  <View style={styles.documentCreateIcon}>
                    <OptionIcon size={17} color={option.disabled ? theme.colors.text3 : theme.colors.text1} strokeWidth={1.55} />
                  </View>
                  <Text style={[styles.documentCreateLabel, option.disabled && styles.documentCreateLabelDisabled]}>{option.label}</Text>
                  {option.disabled ? (
                    <Text style={styles.comingSoonText}>Em breve</Text>
                  ) : null}
                </Pressable>
              )
            })}
          </View>
        </Animated.View>
      </View>

      <BottomSheet visible={Boolean(selectedFile)} onClose={closeFileSheet} title={fileSheetMode === 'details' ? 'Detalhes' : selectedFile?.name}>
        {fileSheetMode === 'menu' ? (
          <View style={styles.fileActionList}>
            <View style={styles.fileActionMeta}>
              <SolidFileIcon type={selectedFile?.type} size={40} />
              <View style={styles.fileActionMetaBody}>
                <Text style={styles.fileActionTitle} numberOfLines={1}>{selectedFile?.name}</Text>
                <Text style={styles.fileActionSubtitle}>{selectedFile?.sizeLabel || selectedFile?.size || '0 KB'} · {selectedFile?.modified}</Text>
              </View>
            </View>
            {fileError ? <Text style={styles.fileInlineError}>{fileError}</Text> : null}

            <Pressable style={({ pressed }) => [styles.fileActionRow, pressed && styles.pressed]} onPress={() => setFileSheetMode('details')} accessibilityRole="button">
              <FileText size={18} color={theme.colors.text1} strokeWidth={1.8} />
              <Text style={styles.fileActionLabel}>Abrir detalhes</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.fileActionRow, pressed && styles.pressed]}
              onPress={() => {
                updateSelectedFile({ favorite: !selectedFile?.favorite })
                closeFileSheet()
              }}
              accessibilityRole="button"
            >
              <Star size={18} color={theme.colors.text1} strokeWidth={1.8} />
              <Text style={styles.fileActionLabel}>{selectedFile?.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</Text>
            </Pressable>
            <Pressable style={[styles.fileActionRow, styles.fileActionRowDisabled]} disabled accessibilityRole="button" accessibilityState={{ disabled: true }}>
              <Text style={[styles.fileActionIconText, styles.fileActionIconTextDisabled]}>Aa</Text>
              <Text style={styles.fileActionLabel}>Renomear</Text>
              <Text style={styles.comingSoonText}>Em breve</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.fileActionRow, pressed && styles.pressed]}
              onPress={() => {
                updateSelectedFile({ shared: !selectedFile?.shared })
                closeFileSheet()
              }}
              accessibilityRole="button"
            >
              <UsersRound size={18} color={theme.colors.text1} strokeWidth={1.8} />
              <Text style={styles.fileActionLabel}>Compartilhar</Text>
            </Pressable>
            <Pressable
              style={[styles.fileActionRow, selectedFile?.type === 'folder' && styles.fileActionRowDisabled]}
              onPress={downloadSelectedFile}
              disabled={selectedFile?.type === 'folder'}
              accessibilityRole="button"
              accessibilityState={{ disabled: selectedFile?.type === 'folder' }}
            >
              <Download size={18} color={selectedFile?.type === 'folder' ? theme.colors.text3 : theme.colors.text1} strokeWidth={1.8} />
              <Text style={styles.fileActionLabel}>Baixar</Text>
              {selectedFile?.type === 'folder' ? (
                <Text style={styles.comingSoonText}>Em breve</Text>
              ) : null}
            </Pressable>
            <Pressable style={[styles.fileActionRow, styles.fileActionRowDisabled]} disabled accessibilityRole="button" accessibilityState={{ disabled: true }}>
              <Folder size={18} color={theme.colors.text3} strokeWidth={1.8} />
              <Text style={styles.fileActionLabel}>Mover</Text>
              <Text style={styles.comingSoonText}>Em breve</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.fileActionRow, styles.fileActionDanger, pressed && styles.pressed]} onPress={deleteSelectedFile} accessibilityRole="button">
              <Trash2 size={18} color={theme.colors.red} strokeWidth={1.8} />
              <Text style={[styles.fileActionLabel, styles.fileActionDangerText]}>{selectedFile?.trashed ? 'Restaurar' : 'Mover para lixeira'}</Text>
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

      </BottomSheet>

      <BottomSheet visible={sortSheetOpen} onClose={() => setSortSheetOpen(false)} title="Ordenar arquivos">
        <View style={styles.sortSheet}>
          {[
            { id: 'name', label: 'Nome' },
            { id: 'modified', label: 'Modificado' },
            { id: 'size', label: 'Tamanho' },
          ].map((option, index, array) => {
            const selected = sortKey === option.id
            const isLast = index === array.length - 1
            return (
              <Pressable
                key={option.id}
                style={({ pressed }) => [
                  styles.sortOption,
                  !isLast && styles.sortOptionBorder,
                  pressed && styles.pressed,
                ]}
                onPress={() => setSortKey(option.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <View style={styles.sortOptionCheck}>
                  {selected ? <Check size={18} color={theme.colors.text1} strokeWidth={2} /> : null}
                </View>
                <Text style={[styles.sortOptionLabel, selected && styles.sortOptionLabelActive]}>{option.label}</Text>
              </Pressable>
            )
          })}

          <View style={styles.sortDivider} />

          {[
            { id: 'asc', label: 'Crescente' },
            { id: 'desc', label: 'Decrescente' },
          ].map((option, index, array) => {
            const selected = sortDirection === option.id
            const isLast = index === array.length - 1
            return (
              <Pressable
                key={option.id}
                style={({ pressed }) => [
                  styles.sortOption,
                  !isLast && styles.sortOptionBorder,
                  pressed && styles.pressed,
                ]}
                onPress={() => setSortDirection(option.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <View style={styles.sortOptionCheck}>
                  {selected ? <Check size={18} color={theme.colors.text1} strokeWidth={2} /> : null}
                </View>
                <Text style={[styles.sortOptionLabel, selected && styles.sortOptionLabelActive]}>{option.label}</Text>
              </Pressable>
            )
          })}

          <Pressable style={({ pressed }) => [styles.sortApply, pressed && styles.pressed]} onPress={() => setSortSheetOpen(false)} accessibilityRole="button">
            <Text style={styles.sortApplyText}>Aplicar</Text>
          </Pressable>
        </View>
      </BottomSheet>

      <BottomSheet visible={Boolean(createFlow)} onClose={() => setCreateFlow(null)} title={createFlow ? createFlow.label : ''}>
        <View style={styles.createFlowPanel}>
          {createFlow ? (
            <>
              <View style={styles.createFlowIcon}>
                {CreateFlowIcon ? <CreateFlowIcon size={22} color={theme.colors.text1} strokeWidth={1.7} /> : null}
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
                value={createName}
                onChangeText={setCreateName}
              />
              <Pressable style={({ pressed }) => [styles.filePrimaryButton, pressed && styles.pressed]} onPress={submitCreateFlow} accessibilityRole="button">
                <Text style={styles.filePrimaryButtonText}>Concluir</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </BottomSheet>
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
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
    paddingTop: 24,
    paddingBottom: 104,
  },
  pressed: {
    opacity: 0.75,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  topbarText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  pageEyebrow: {
    color: theme.colors.text3,
    ...theme.type.eyebrow,
    textTransform: 'uppercase',
  },
  pageTitle: {
    color: theme.colors.text1,
    ...theme.type.display,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
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
  sectionChipsScroller: {
    marginHorizontal: -theme.spacing.screenX,
    paddingHorizontal: theme.spacing.screenX,
    marginBottom: 18,
  },
  sectionChips: {
    gap: 8,
    paddingRight: theme.spacing.screenX,
  },
  sectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
  },
  sectionChipActive: {
    backgroundColor: theme.colors.surface1,
    borderColor: theme.colors.border1,
  },
  sectionChipLabel: {
    color: theme.colors.text2,
    fontSize: 13,
    fontWeight: '500',
  },
  sectionChipLabelActive: {
    color: theme.colors.text1,
    fontWeight: '600',
  },
  sectionChipCount: {
    color: theme.colors.text3,
    fontSize: 12,
    fontWeight: '500',
    minWidth: 14,
    textAlign: 'right',
  },
  sectionChipCountActive: {
    color: theme.colors.text2,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  sectionMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  sectionMetaCount: {
    color: theme.colors.text1,
    ...theme.type.heading,
  },
  sectionMetaLabel: {
    color: theme.colors.text3,
    fontSize: 13,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
    minWidth: 0,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 3,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  viewToggleBtn: {
    width: 34,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  viewToggleBtnActive: {
    backgroundColor: theme.colors.surface1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    maxWidth: 140,
  },
  sortButtonText: {
    flexShrink: 1,
    color: theme.colors.text2,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
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
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  fileRowFirst: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border1,
  },
  fileIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
  },
  fileBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  fileName: {
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  fileMeta: {
    color: theme.colors.text3,
    fontSize: 12.5,
  },
  fileMetaRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sharedBadgeText: {
    flexShrink: 0,
    color: theme.colors.text3,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 4,
  },
  iconAction: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  gridRow: {
    gap: 12,
  },
  gridItem: {
    flex: 1,
    marginBottom: 12,
    padding: 13,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
  },
  gridHero: {
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  gridHeroActions: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  gridName: {
    color: theme.colors.text1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500',
    letterSpacing: -0.2,
    minHeight: 38,
  },
  gridMeta: {
    color: theme.colors.text3,
    fontSize: 12,
    marginTop: 4,
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
    paddingRight: theme.spacing.screenX,
    paddingBottom: 2,
    paddingLeft: theme.spacing.screenX,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    alignSelf: 'center',
    marginBottom: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border2,
  },
  sheetTitle: {
    color: theme.colors.text1,
    ...theme.type.title,
    textAlign: 'center',
    marginBottom: 16,
  },
  quickCreateGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickCreateButton: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
  },
  quickCreateButtonDisabled: {
    opacity: 0.55,
  },
  quickCreateLabel: {
    color: theme.colors.text1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
  },
  quickCreateLabelDisabled: {
    color: theme.colors.text3,
  },
  comingSoonText: {
    color: theme.colors.text3,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  documentCreateList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border1,
  },
  documentCreateRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  documentCreateRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  documentCreateRowDisabled: {
    opacity: 0.55,
  },
  documentCreateIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  documentCreateLabel: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  documentCreateLabelDisabled: {
    color: theme.colors.text3,
  },
  fileActionList: {
    gap: 0,
  },
  fileActionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    marginBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
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
    letterSpacing: -0.2,
  },
  fileActionSubtitle: {
    color: theme.colors.text3,
    fontSize: 12.5,
  },
  fileActionRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  fileActionRowDisabled: {
    opacity: 0.5,
  },
  fileActionIconText: {
    width: 18,
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  fileActionIconTextDisabled: {
    color: theme.colors.text3,
  },
  fileActionLabel: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '500',
  },
  fileInlineError: {
    color: theme.colors.red,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.red,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.dangerBg,
  },
  fileActionDanger: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  fileActionDangerText: {
    color: theme.colors.red,
  },
  fileDetails: {
    gap: 5,
  },
  fileDetailsLabel: {
    color: theme.colors.text3,
    ...theme.type.eyebrow,
    textTransform: 'uppercase',
    marginTop: 10,
  },
  fileDetailsValue: {
    color: theme.colors.text1,
    fontSize: 16,
    fontWeight: '500',
  },
  filePrimaryButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.text1,
    alignSelf: 'stretch',
  },
  filePrimaryButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  createFlowPanel: {
    alignItems: 'center',
  },
  createFlowIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    marginBottom: 12,
  },
  createFlowTitle: {
    color: theme.colors.text1,
    ...theme.type.heading,
    marginBottom: 6,
  },
  createFlowText: {
    color: theme.colors.text3,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 300,
  },
  createFlowInput: {
    alignSelf: 'stretch',
    minHeight: 46,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    borderRadius: theme.radius.md,
    color: theme.colors.text1,
    fontSize: 15,
    marginBottom: 14,
    backgroundColor: theme.colors.surface2,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  sortSheet: {
    gap: 0,
  },
  sortOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  sortOptionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  sortOptionCheck: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortOptionLabel: {
    flex: 1,
    color: theme.colors.text2,
    fontSize: 15,
    fontWeight: '500',
  },
  sortOptionLabelActive: {
    color: theme.colors.text1,
    fontWeight: '600',
  },
  sortDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border1,
    marginVertical: 8,
  },
  sortApply: {
    minHeight: 46,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.text1,
  },
  sortApplyText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
})

let styles = createStyles(theme)
