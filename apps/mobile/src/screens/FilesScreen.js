import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { ArrowDown, Code2, FileText, Folder, Image, MoreHorizontal, Plus, Search, SlidersHorizontal } from 'lucide-react-native'
import { files } from '../data/demoData'
import { theme } from '../theme/tokens'

const fileIcons = {
  folder: Folder,
  pdf: FileText,
  doc: FileText,
  code: Code2,
  image: Image,
}

export default function FilesScreen() {
  const [query, setQuery] = useState('')
  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return files
    return files.filter((file) => file.name.toLowerCase().includes(normalized))
  }, [query])

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Arquivos</Text>
          <Text style={styles.meta}>{filteredFiles.length} itens no workspace</Text>
        </View>

        <View style={styles.controls}>
          <View style={styles.sort}>
            <ArrowDown size={17} color={theme.colors.text2} strokeWidth={1.8} />
            <Text style={styles.sortText}>Nome</Text>
          </View>
          <Pressable style={styles.filterButton} accessibilityRole="button" accessibilityLabel="Filtrar arquivos">
            <SlidersHorizontal size={20} color={theme.colors.text2} strokeWidth={1.7} />
          </Pressable>
        </View>

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
      </ScrollView>

      <View style={styles.floatingControls} pointerEvents="box-none">
        <View style={styles.search}>
          <Search size={21} color={theme.colors.text1} strokeWidth={1.8} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            placeholder="Pesquisar seus arquivos"
            placeholderTextColor={theme.colors.text2}
            autoCapitalize="none"
          />
        </View>
        <Pressable style={styles.addButton} accessibilityRole="button" accessibilityLabel="Adicionar arquivo">
          <Plus size={30} color={theme.colors.white} strokeWidth={1.7} />
        </Pressable>
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
    paddingBottom: 112,
  },
  header: {
    marginBottom: 26,
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
  controls: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
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
  },
  search: {
    flex: 1,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 18,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    shadowColor: theme.colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 16,
  },
  list: {
    gap: 2,
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
  floatingControls: {
    position: 'absolute',
    left: 34,
    right: 34,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  addButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text1,
    shadowColor: theme.colors.black,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
})
