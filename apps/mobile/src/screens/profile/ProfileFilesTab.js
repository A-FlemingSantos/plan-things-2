import { StyleSheet, Text, View } from 'react-native'
import { PackageOpen } from 'lucide-react-native'
import { theme } from '../../theme/tokens'
import { useThemedStyles } from '../../theme/ThemeProvider'

export default function ProfileFilesTab() {
  styles = useThemedStyles(createStyles)

  return (
    <View style={styles.emptyState}>
      <PackageOpen size={18} color={theme.colors.text3} strokeWidth={1.8} />
      <Text style={styles.emptyStateTitle}>Nenhum arquivo público no perfil</Text>
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
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
})

let styles = createStyles(theme)
