import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { theme } from '../theme/tokens'
import { useThemedStyles } from '../theme/ThemeProvider'

const WELCOME_TYPEWRITER_MESSAGE = 'Vamos planejar'
const CHAR_DELAY_MS = 42

export default function WelcomeTypewriter() {
  styles = useThemedStyles(createStyles)
  const [displayedText, setDisplayedText] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    let index = 0
    const typingInterval = setInterval(() => {
      index += 1
      setDisplayedText(WELCOME_TYPEWRITER_MESSAGE.slice(0, index))

      if (index >= WELCOME_TYPEWRITER_MESSAGE.length) {
        clearInterval(typingInterval)
      }
    }, CHAR_DELAY_MS)

    return () => clearInterval(typingInterval)
  }, [])

  useEffect(() => {
    const blink = setInterval(() => {
      setCursorVisible((visible) => !visible)
    }, 500)

    return () => clearInterval(blink)
  }, [])

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.text} accessibilityLiveRegion="polite">
          {displayedText}
        </Text>
        <View style={[styles.cursorDot, cursorVisible ? null : styles.cursorHidden]} />
      </View>
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
  wrap: {
    width: '100%',
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  text: {
    color: theme.colors.text1,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.8,
    fontWeight: '700',
    textAlign: 'center',
  },
  cursorDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: theme.colors.text1,
  },
  cursorHidden: {
    opacity: 0,
  },
})

let styles = createStyles(theme)
