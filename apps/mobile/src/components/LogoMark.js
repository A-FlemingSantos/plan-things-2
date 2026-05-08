import { View, StyleSheet } from 'react-native'
import { theme } from '../theme/tokens'
import { useThemedStyles } from '../theme/ThemeProvider'

export default function LogoMark({ size = 30, inverted = false }) {
  styles = useThemedStyles(createStyles)
  const gap = Math.max(2, Math.round(size * 0.1))
  const padding = 4
  const block = (size - padding * 2 - gap) / 2

  return (
    <View style={[styles.mark, { width: size, height: size, gap, padding }, inverted && styles.markInverted]}>
      {[1, 0.35, 0.55, 0.75].map((opacity, index) => (
        <View
          key={index}
          style={[
            styles.block,
            inverted && styles.blockInverted,
            {
              width: block,
              height: block,
              opacity,
              borderRadius: Math.max(3, Math.round(size * 0.1)),
            },
          ]}
        />
      ))}
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
  mark: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.text1,
  },
  markInverted: {
    backgroundColor: theme.colors.textInverse,
  },
  block: {
    backgroundColor: theme.colors.textInverse,
  },
  blockInverted: {
    backgroundColor: theme.colors.text1,
  },
})

let styles = createStyles(theme)
