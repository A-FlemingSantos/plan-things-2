import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Animated, Easing, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { platformShadow } from '../theme/shadowStyles'
import { theme } from '../theme/tokens'
import { useThemedStyles } from '../theme/ThemeProvider'

export default function BottomSheet({ children, onClose, title, visible }) {
  styles = useThemedStyles(createStyles)
  const progress = useRef(new Animated.Value(0)).current
  const dragY = useRef(new Animated.Value(0)).current
  const { height } = useWindowDimensions()
  const hiddenOffset = Math.max(height, 640)
  const maxSheetHeight = Math.max(300, height - 42)

  useEffect(() => {
    if (!visible) {
      progress.setValue(0)
      dragY.setValue(0)
      return
    }

    dragY.setValue(0)
    Animated.timing(progress, {
      toValue: 1,
      duration: 230,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [dragY, progress, visible])

  const close = useCallback(() => {
    dragY.setValue(0)
    Animated.timing(progress, {
      toValue: 0,
      duration: 190,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose?.()
    })
  }, [dragY, onClose, progress])

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
    onPanResponderMove: (_, gestureState) => {
      dragY.setValue(Math.max(gestureState.dy, 0))
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 70 || gestureState.vy > 0.7) {
        close()
        return
      }

      Animated.spring(dragY, {
        toValue: 0,
        damping: 18,
        stiffness: 180,
        mass: 0.7,
        useNativeDriver: true,
      }).start()
    },
  }), [close, dragY])

  const translateY = Animated.add(
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [hiddenOffset, 0],
    }),
    dragY,
  ).interpolate({
    inputRange: [0, hiddenOffset],
    outputRange: [0, hiddenOffset],
    extrapolate: 'clamp',
  })
  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.34],
  })

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
      presentationStyle="overFullScreen"
      onRequestClose={close}
    >
      <View style={styles.layer}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={styles.overlayPress} onPress={close} accessibilityRole="button" accessibilityLabel="Fechar painel" />
        </Animated.View>

        <Animated.View style={[styles.sheet, { maxHeight: maxSheetHeight, transform: [{ translateY }] }]}>
          <View style={styles.dragArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
            {title ? <Text style={styles.title}>{title}</Text> : null}
          </View>
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const createStyles = (theme) => StyleSheet.create({
  layer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.black,
  },
  overlayPress: {
    flex: 1,
  },
  sheet: {
    paddingTop: 10,
    paddingRight: 22,
    paddingBottom: 22,
    paddingLeft: 22,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: theme.colors.surface1,
    ...platformShadow({
      boxShadow: '0 -4px 18px rgba(0, 0, 0, 0.14)',
      color: theme.colors.black,
      offset: { width: 0, height: -4 },
      opacity: 0.14,
      radius: 18,
      elevation: 12,
    }),
  },
  dragArea: {
    marginRight: -22,
    marginLeft: -22,
    paddingRight: 22,
    paddingLeft: 22,
  },
  handle: {
    width: 46,
    height: 5,
    alignSelf: 'center',
    marginBottom: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.gray600,
  },
  title: {
    color: theme.colors.text1,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  contentScroll: {
    flexGrow: 0,
  },
  content: {
    paddingBottom: 2,
  },
})

let styles = createStyles(theme)
