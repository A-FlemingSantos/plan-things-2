import { View, Text, StyleSheet } from 'react-native'
import LogoMark from './LogoMark'
import { theme } from '../theme/tokens'
import { useThemedStyles } from '../theme/ThemeProvider'

export default function ScreenHeader({ eyebrow, title, meta }) {
  styles = useThemedStyles(createStyles)
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <LogoMark size={28} />
        <Text style={styles.brand}>Plan Things</Text>
      </View>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
  header: {
    gap: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  brand: {
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '500',
  },
  eyebrow: {
    color: theme.colors.text3,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    color: theme.colors.text1,
    ...theme.type.display,
  },
  meta: {
    color: theme.colors.text3,
    fontSize: 12,
    paddingBottom: 4,
  },
})

let styles = createStyles(theme)
