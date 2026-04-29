import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Code2, FileText, Folder, Image, Search } from 'lucide-react-native'
import ScreenHeader from '../components/ScreenHeader'
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
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="Workspace" title="Arquivos" meta={`${filteredFiles.length} itens`} />

      <View style={styles.search}>
        <Search size={16} color={theme.colors.text3} strokeWidth={1.8} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          placeholder="Buscar arquivos..."
          placeholderTextColor={theme.colors.text3}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.list}>
        {filteredFiles.map((file) => {
          const Icon = fileIcons[file.type] ?? FileText
          return (
            <View key={file.id} style={styles.fileRow}>
              <View style={styles.fileIcon}>
                <Icon size={18} color={theme.colors.text2} strokeWidth={1.7} />
              </View>
              <View style={styles.fileBody}>
                <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                <Text style={styles.fileMeta} numberOfLines={1}>
                  {file.modified}{file.size ? ` · ${file.size}` : ''}{file.shared ? ' · compartilhado' : ''}
                </Text>
              </View>
            </View>
          )
        })}
      </View>
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
    paddingBottom: 28,
  },
  search: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    marginBottom: theme.spacing.section,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 14,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border1,
  },
  fileRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface3,
  },
  fileBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  fileName: {
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '500',
  },
  fileMeta: {
    color: theme.colors.text3,
    fontSize: 12,
  },
})
