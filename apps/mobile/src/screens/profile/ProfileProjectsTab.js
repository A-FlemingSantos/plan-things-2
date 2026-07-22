import { StyleSheet, Text, View } from 'react-native'
import { LayoutGrid } from 'lucide-react-native'
import { usePlans } from '../../providers/PlansProvider'
import { theme } from '../../theme/tokens'
import { useThemedStyles } from '../../theme/ThemeProvider'

export default function ProfileProjectsTab() {
  styles = useThemedStyles(createStyles)
  const { plans } = usePlans()

  if (!plans.length) {
    return (
      <View style={styles.emptyState}>
        <LayoutGrid size={18} color={theme.colors.text3} strokeWidth={1.8} />
        <Text style={styles.emptyStateTitle}>Nenhum projeto público no perfil</Text>
      </View>
    )
  }

  return (
    <View style={styles.list}>
      {plans.map((plan) => (
        <View key={plan.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: plan.cover ?? theme.colors.text3 }]} />
          <Text style={styles.rowName} numberOfLines={1}>{plan.name}</Text>
          <Text style={styles.rowCount}>{plan.tasks}</Text>
        </View>
      ))}
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
  list: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowName: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '500',
  },
  rowCount: {
    color: theme.colors.text3,
    fontSize: 12,
  },
})

let styles = createStyles(theme)
