import { useCallback, useMemo, useRef, useState } from 'react'
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  Archive,
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

const fileTypeTone = {
  folder: { background: theme.colors.blue, icon: theme.colors.white },
  pdf: { background: theme.colors.red, icon: theme.colors.white },
  doc: { background: theme.colors.amber, icon: theme.colors.white },
  code: { background: theme.colors.green, icon: theme.colors.white },
  image: { background: theme.colors.purple, icon: theme.colors.white },
}

const fileSections = [
  { id: 'mine', label: 'Meus arquivos', icon: Folder },
  { id: 'shared', label: 'Compartilhado', icon: UsersRound },
  { id: 'recent', label: 'Recentes', icon: Clock3 },
  { id: 'favorites', label: 'Favoritos', icon: Star },
  { id: 'archived', label: 'Arquivados', icon: Archive },
  { id: 'trash', label: 'Lixeira', icon: Trash2 },
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
  const tone = fileTypeTone[type] ?? fileTypeTone.doc
  return (
    <View
      style={[
        styles.fileIconTile,
        {
          width: size,
          height: size,
          borderRadius: Math.max(7, size * 0.22),
          backgroundColor: tone.background,
        },
      ]}
    >
      <Icon size={Math.round(size * 0.58)} color={tone.icon} strokeWidth={2.05} />
    </View>
  )
}

function parseFileSize(input) {
  if (!input) return 0
  const trimmed = String(input).trim().toUpperCase()
  const match = trimmed.match(/(\d+(?:[.,]\d+)?)\s*(B|KB|MB|GB)/)
  if (!match) return 0
  const raw = match[1].replace(',', '.')
  const value = Number(raw)
  if (!Number.isFinite(value)) return 0
  const unit = match[2]
  const factor = unit === 'GB' ? 1024 ** 3 : unit === 'MB' ? 1024 ** 2 : unit === 'KB' ? 1024 : 1
  return value * factor
}

function parseModifiedToMinutesAgo(input) {
  const value = String(input ?? '').trim().toLowerCase()
  if (!value) return Number.POSITIVE_INFINITY
  if (value === 'agora') return 0
  if (value === 'ontem') return 24 * 60

  const match = value.match(/^há\s*(\d+)\s*(min|minutos|h|horas|hora|dia|dias|semana|semanas)$/)
  if (!match) return Number.POSITIVE_INFINITY

  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return Number.POSITIVE_INFINITY

  const unit = match[2]
  if (unit === 'min' || unit === 'minutos') return amount
  if (unit === 'h' || unit === 'hora' || unit === 'horas') return amount * 60
  if (unit === 'dia' || unit === 'dias') return amount * 24 * 60
  if (unit === 'semana' || unit === 'semanas') return amount * 7 * 24 * 60
  return Number.POSITIVE_INFINITY
}

export default function FilesScreen({ bottomOverlayOffset = 0 }) {
  const [localFiles, setLocalFiles] = useState(() => files.map((file) => ({ ...file, section: 'mine' })))
  const [query, setQuery] = useState('')
  const [activeSection, setActiveSection] = useState('mine')
  const [displayMode, setDisplayMode] = useState('list')
  const [sortSheetOpen, setSortSheetOpen] = useState(false)
  const [sortKey, setSortKey] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [newItemSheetVisible, setNewItemSheetVisible] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState(null)
  const [fileSheetMode, setFileSheetMode] = useState('menu')
  const [renameValue, setRenameValue] = useState('')
  const [createFlow, setCreateFlow] = useState(null)
  const sheetProgress = useRef(new Animated.Value(0)).current
  const sheetDragY = useRef(new Animated.Value(0)).current
  const selectedFile = localFiles.find((file) => file.id === selectedFileId) ?? null
  const CreateFlowIcon = createFlow?.icon
  const activeSectionLabel = fileSections.find((section) => section.id === activeSection)?.label ?? 'Arquivos'

  const sectionCounts = useMemo(() => {
    const counts = {
      mine: 0,
      shared: 0,
      recent: 0,
      favorites: 0,
      archived: 0,
      trash: 0,
    }

    for (const file of localFiles) {
      if (file.trashed) {
        counts.trash += 1
        continue
      }

      counts.recent += 1
      if (file.archived) counts.archived += 1
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

      if (activeSection === 'archived') return Boolean(file.archived)
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
        return parseFileSize(a.size) - parseFileSize(b.size)
      }
      if (effectiveSortKey === 'modified') {
        return parseModifiedToMinutesAgo(a.modified) - parseModifiedToMinutesAgo(b.modified)
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
    const patch = {
      section,
      shared: section === 'shared',
      favorite: section === 'favorites',
      archived: section === 'archived',
      trashed: false,
      modified: 'agora',
    }

    updateSelectedFile(patch)
    closeFileSheet()
  }

  const deleteSelectedFile = () => {
    updateSelectedFile({ trashed: true, archived: false, modified: 'agora' })
    closeFileSheet()
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
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <View style={styles.topbarText}>
            <Text style={styles.pageTitle}>Arquivos</Text>
            <Text style={styles.pageSubtitle} numberOfLines={1}>
              {activeSectionLabel} · {filteredFiles.length} itens
            </Text>
          </View>
          <View style={styles.topbarActions}>
            <Pressable
              style={styles.iconButton}
              onPress={() => setSortSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Ordenar arquivos"
            >
              <ArrowDownUp size={18} color={theme.colors.text1} strokeWidth={1.9} />
            </Pressable>
            <Pressable
              style={styles.newButton}
              onPress={openNewItemSheet}
              accessibilityRole="button"
              accessibilityLabel="Adicionar arquivo"
            >
              <Plus size={18} color={theme.colors.white} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Search size={15} color={theme.colors.text3} strokeWidth={1.8} />
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
            <Pressable style={styles.searchClear} onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Limpar busca">
              <X size={14} color={theme.colors.text2} strokeWidth={1.8} />
            </Pressable>
          ) : null}
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
                style={[styles.sectionChip, isActive && styles.sectionChipActive]}
                onPress={() => setActiveSection(section.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <SectionIcon size={15} color={isActive ? theme.colors.text1 : theme.colors.text3} strokeWidth={1.9} />
                <Text style={[styles.sectionChipLabel, isActive && styles.sectionChipLabelActive]} numberOfLines={1}>
                  {section.label}
                </Text>
                <View style={[styles.sectionChipCount, isActive && styles.sectionChipCountActive]}>
                  <Text style={[styles.sectionChipCountText, isActive && styles.sectionChipCountTextActive]}>{count}</Text>
                </View>
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={styles.toolbar}>
          <View style={styles.viewToggle}>
            <Pressable
              style={[styles.viewToggleBtn, displayMode === 'grid' && styles.viewToggleBtnActive]}
              onPress={() => setDisplayMode('grid')}
              accessibilityRole="button"
              accessibilityLabel="Visualizacao em grade"
            >
              <Grid2X2 size={15} color={displayMode === 'grid' ? theme.colors.text1 : theme.colors.text3} strokeWidth={1.8} />
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
            style={styles.sortButton}
            onPress={() => setSortSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir opções de ordenação"
          >
            <Text style={styles.sortButtonText} numberOfLines={1}>
              Ordenar: {activeSection === 'recent' ? 'Modificado' : sortKey === 'modified' ? 'Modificado' : sortKey === 'size' ? 'Tamanho' : 'Nome'}
            </Text>
            <ArrowDown size={16} color={theme.colors.text3} strokeWidth={1.8} />
          </Pressable>
        </View>

        {filteredFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Folder size={18} color={theme.colors.text3} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>Nada por aqui</Text>
            <Text style={styles.emptyHint}>
              {query ? 'Tente buscar por outro termo.' : 'Envie arquivos, crie pastas e organize sua biblioteca.'}
            </Text>
          </View>
        ) : displayMode === 'list' ? (
          <View style={styles.list}>
            {filteredFiles.map((file) => {
              return (
                <View key={file.id} style={styles.fileRow}>
                  <View style={styles.fileIcon}>
                    <SolidFileIcon type={file.type} size={32} />
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
                  <View style={styles.fileActions}>
                    <Pressable
                      style={styles.starButton}
                      onPress={() => {
                        setLocalFiles((currentFiles) => currentFiles.map((item) => (
                          item.id === file.id ? { ...item, favorite: !item.favorite, modified: 'agora' } : item
                        )))
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={file.favorite ? `Remover ${file.name} dos favoritos` : `Favoritar ${file.name}`}
                    >
                      <Star size={18} color={file.favorite ? theme.colors.amber : theme.colors.text3} strokeWidth={1.9} />
                    </Pressable>
                    <Pressable
                      style={styles.moreButton}
                      onPress={() => openFileMenu(file)}
                      accessibilityRole="button"
                      accessibilityLabel={`Mais opções para ${file.name}`}
                    >
                      <MoreHorizontal size={20} color={theme.colors.text2} strokeWidth={2} />
                    </Pressable>
                  </View>
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
                    <View style={styles.gridActions}>
                      <Pressable
                        style={styles.starButton}
                        onPress={() => {
                          setLocalFiles((currentFiles) => currentFiles.map((item) => (
                            item.id === file.id ? { ...item, favorite: !item.favorite, modified: 'agora' } : item
                          )))
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={file.favorite ? `Remover ${file.name} dos favoritos` : `Favoritar ${file.name}`}
                      >
                        <Star size={18} color={file.favorite ? theme.colors.amber : theme.colors.text3} strokeWidth={1.9} />
                      </Pressable>
                      <Pressable
                        style={styles.gridMoreButton}
                        onPress={() => openFileMenu(file)}
                        accessibilityRole="button"
                        accessibilityLabel={`Mais opções para ${file.name}`}
                      >
                        <MoreHorizontal size={20} color={theme.colors.text2} strokeWidth={2} />
                      </Pressable>
                    </View>
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
            <Pressable
              style={styles.fileActionRow}
              onPress={() => {
                updateSelectedFile({ favorite: !selectedFile?.favorite, modified: 'agora' })
                closeFileSheet()
              }}
              accessibilityRole="button"
            >
              <Star size={18} color={theme.colors.text1} strokeWidth={1.8} />
              <Text style={styles.fileActionLabel}>{selectedFile?.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</Text>
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
            <Pressable style={styles.fileActionRow} onPress={closeFileSheet} accessibilityRole="button">
              <Download size={18} color={theme.colors.text1} strokeWidth={1.8} />
              <Text style={styles.fileActionLabel}>Baixar (demo)</Text>
            </Pressable>
            <Pressable style={styles.fileActionRow} onPress={() => setFileSheetMode('move')} accessibilityRole="button">
              <Folder size={18} color={theme.colors.text1} strokeWidth={1.8} />
              <Text style={styles.fileActionLabel}>Mover</Text>
            </Pressable>
            <Pressable style={[styles.fileActionRow, styles.fileActionDanger]} onPress={deleteSelectedFile} accessibilityRole="button">
              <Trash2 size={18} color={theme.colors.red} strokeWidth={1.8} />
              <Text style={[styles.fileActionLabel, styles.fileActionDangerText]}>Mover para lixeira</Text>
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

      <BottomSheet visible={sortSheetOpen} onClose={() => setSortSheetOpen(false)} title="Ordenar arquivos">
        <View style={styles.sortSheet}>
          {[
            { id: 'name', label: 'Nome' },
            { id: 'modified', label: 'Modificado' },
            { id: 'size', label: 'Tamanho' },
          ].map((option) => {
            const selected = sortKey === option.id
            return (
              <Pressable
                key={option.id}
                style={[styles.sortOption, selected && styles.sortOptionActive]}
                onPress={() => setSortKey(option.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <View style={styles.sortOptionCheck}>
                  {selected ? <Check size={20} color={theme.colors.text1} strokeWidth={2} /> : null}
                </View>
                <Text style={[styles.sortOptionLabel, selected && styles.sortOptionLabelActive]}>{option.label}</Text>
              </Pressable>
            )
          })}

          <View style={styles.sortDivider} />

          {[
            { id: 'asc', label: 'Crescente' },
            { id: 'desc', label: 'Decrescente' },
          ].map((option) => {
            const selected = sortDirection === option.id
            return (
              <Pressable
                key={option.id}
                style={[styles.sortOption, selected && styles.sortOptionActive]}
                onPress={() => setSortDirection(option.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <View style={styles.sortOptionCheck}>
                  {selected ? <Check size={20} color={theme.colors.text1} strokeWidth={2} /> : null}
                </View>
                <Text style={[styles.sortOptionLabel, selected && styles.sortOptionLabelActive]}>{option.label}</Text>
              </Pressable>
            )
          })}

          <Pressable style={styles.sortApply} onPress={() => setSortSheetOpen(false)} accessibilityRole="button">
            <Text style={styles.sortApplyText}>Aplicar</Text>
          </Pressable>
        </View>
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
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    outlineStyle: 'none',
  },
  newButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: theme.colors.text1,
    outlineStyle: 'none',
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
  searchClear: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: theme.colors.surface2,
  },
  sectionChipsScroller: {
    marginHorizontal: -theme.spacing.screenX,
    paddingHorizontal: theme.spacing.screenX,
    marginBottom: 14,
  },
  sectionChips: {
    gap: 8,
    paddingRight: theme.spacing.screenX,
  },
  sectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    outlineStyle: 'none',
  },
  sectionChipActive: {
    backgroundColor: theme.colors.surface1,
    borderColor: theme.colors.text1,
  },
  sectionChipLabel: {
    color: theme.colors.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionChipLabelActive: {
    color: theme.colors.text1,
  },
  sectionChipCount: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface3,
    borderWidth: 1,
    borderColor: theme.colors.border1,
  },
  sectionChipCountActive: {
    backgroundColor: theme.colors.text1,
    borderColor: theme.colors.text1,
  },
  sectionChipCountText: {
    color: theme.colors.text2,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionChipCountTextActive: {
    color: theme.colors.white,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
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
  sortButton: {
    flex: 1,
    minWidth: 0,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    outlineStyle: 'none',
  },
  sortButtonText: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text2,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    marginBottom: 18,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    marginBottom: 10,
  },
  emptyTitle: {
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyHint: {
    color: theme.colors.text2,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
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
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 14,
    paddingVertical: 0,
    outlineStyle: 'none',
  },
  list: {
    zIndex: 1,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border1,
  },
  fileRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
  },
  fileIcon: {
    width: 42,
    height: 42,
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
    fontSize: 15,
    fontWeight: '700',
  },
  fileMeta: {
    color: theme.colors.text2,
    fontSize: 12,
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
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 10,
  },
  starButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    outlineStyle: 'none',
  },
  moreButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    outlineStyle: 'none',
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
  gridActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gridMoreButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    outlineStyle: 'none',
  },
  gridName: {
    color: theme.colors.text1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
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
  sortSheet: {
    gap: 10,
  },
  sortOption: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    outlineStyle: 'none',
  },
  sortOptionActive: {
    backgroundColor: theme.colors.surface1,
    borderColor: theme.colors.text1,
  },
  sortOptionCheck: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface1,
  },
  sortOptionLabel: {
    flex: 1,
    color: theme.colors.text2,
    fontSize: 15,
    fontWeight: '600',
  },
  sortOptionLabelActive: {
    color: theme.colors.text1,
    fontWeight: '800',
  },
  sortDivider: {
    height: 1,
    backgroundColor: theme.colors.border1,
    marginTop: 2,
    marginBottom: 2,
  },
  sortApply: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.text1,
  },
  sortApplyText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
})
