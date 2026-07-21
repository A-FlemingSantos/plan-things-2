import { StyleSheet, Text, View } from 'react-native'
import { BookOpen } from 'lucide-react-native'
import { theme } from '../theme/tokens'
import { useThemedStyles } from '../theme/ThemeProvider'

export default function DocsScreen() {
  styles = useThemedStyles(createStyles)

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Docs</Text>
        <Text style={styles.subtitle}>Documentos e knowledge base do workspace.</Text>
      </View>

      <View style={styles.empty}>
        <BookOpen size={28} color={theme.colors.text2} strokeWidth={1.75} />
        <Text style={styles.emptyTitle}>Em breve</Text>
        <Text style={styles.emptyText}>Estamos preparando a experiência de docs no mobile.</Text>
      </View>
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 8,
  },
  header: {
    gap: 4,
    marginBottom: 28,
  },
  title: {
    color: theme.colors.text1,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.text2,
    fontSize: 14,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 120,
  },
  emptyTitle: {
    color: theme.colors.text1,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: theme.colors.text2,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
  },
})

let styles = createStyles(theme)
