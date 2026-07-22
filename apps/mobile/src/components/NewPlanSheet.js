import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, ChevronDown, ImageOff } from 'lucide-react-native'
import { BACKGROUND_COLLECTIONS } from '../data/backgroundCollections'
import { theme } from '../theme/tokens'
import { useThemedStyles } from '../theme/ThemeProvider'

// The sheet animates `height` (layout prop → must use JS driver), so every
// animation on this surface stays on the JS driver to avoid mixing drivers.
const USE_NATIVE_DRIVER = false

// Default is NO cover — the plain app background (white/black).
function isImageSelected(selected, id) {
  return selected?.type === 'image' && selected.id === id
}

export default function NewPlanSheet({ visible, onClose, onCreate }) {
  styles = useThemedStyles(createStyles)
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()

  const expandedHeight = Math.max(360, screenHeight - Math.max(insets.top, 12) - 6)

  const [name, setName] = useState('')
  const [selected, setSelected] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState(false)
  // Measured height of the collapsed content (header + form + footer, no gallery).
  const [collapsedHeight, setCollapsedHeight] = useState(Math.min(expandedHeight, 520))

  const progress = useRef(new Animated.Value(0)).current
  const sheetHeight = useRef(new Animated.Value(collapsedHeight)).current
  const dragTranslate = useRef(new Animated.Value(0)).current
  const heightRef = useRef(collapsedHeight)
  const expandedRef = useRef(false)
  const collapsedRef = useRef(collapsedHeight)

  useEffect(() => { collapsedRef.current = collapsedHeight }, [collapsedHeight])

  useEffect(() => {
    const id = sheetHeight.addListener(({ value }) => { heightRef.current = value })
    return () => sheetHeight.removeListener(id)
  }, [sheetHeight])

  // Keep the collapsed sheet snug to its content while collapsed.
  useEffect(() => {
    if (!visible || expandedRef.current) return
    sheetHeight.setValue(collapsedHeight)
    heightRef.current = collapsedHeight
  }, [collapsedHeight, sheetHeight, visible])

  const animateTo = useCallback((toValue, snapExpanded) => {
    expandedRef.current = snapExpanded
    setExpanded(snapExpanded)
    Animated.timing(dragTranslate, { toValue: 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE_DRIVER }).start()
    Animated.timing(sheetHeight, { toValue, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE_DRIVER }).start()
  }, [dragTranslate, sheetHeight])

  const close = useCallback(() => {
    Animated.timing(progress, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: USE_NATIVE_DRIVER })
      .start(({ finished }) => { if (finished) onClose?.() })
  }, [onClose, progress])

  useEffect(() => {
    if (!visible) return
    setName('')
    setSelected(null)
    setExpanded(false)
    setBusy(false)
    expandedRef.current = false
    sheetHeight.setValue(collapsedRef.current)
    heightRef.current = collapsedRef.current
    dragTranslate.setValue(0)
    progress.setValue(0)
    Animated.timing(progress, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE_DRIVER }).start()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const collapse = useCallback(() => animateTo(collapsedRef.current, false), [animateTo])
  const expand = useCallback(() => animateTo(expandedHeight, true), [animateTo, expandedHeight])

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => {
      const startHeight = expandedRef.current ? expandedHeight : collapsedRef.current
      const nextHeight = startHeight - g.dy
      if (nextHeight > collapsedRef.current) {
        // Growing beyond collapsed → mount the gallery so it can be revealed.
        if (!expandedRef.current) { expandedRef.current = true; setExpanded(true) }
        sheetHeight.setValue(Math.min(nextHeight, expandedHeight))
        dragTranslate.setValue(0)
      } else {
        sheetHeight.setValue(collapsedRef.current)
        dragTranslate.setValue(collapsedRef.current - nextHeight)
      }
    },
    onPanResponderRelease: (_, g) => {
      const pinnedAtCollapsed = heightRef.current <= collapsedRef.current + 1
      if (pinnedAtCollapsed && (g.dy > 90 || g.vy > 0.8)) {
        close()
        return
      }
      const midpoint = (collapsedRef.current + expandedHeight) / 2
      if (g.vy < -0.5 || heightRef.current >= midpoint) {
        animateTo(expandedHeight, true)
      } else {
        animateTo(collapsedRef.current, false)
      }
    },
  }), [animateTo, close, dragTranslate, expandedHeight, sheetHeight])

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed || busy) return
    try {
      setBusy(true)
      await onCreate?.({ name: trimmed, selected })
    } finally {
      setBusy(false)
    }
  }

  const measureCollapsed = (key) => (event) => {
    const h = Math.round(event.nativeEvent.layout.height)
    measured.current[key] = h
    const total = measured.current.head + measured.current.body + measured.current.footer
    if (total > 0) {
      const next = Math.min(expandedHeight, total)
      setCollapsedHeight((current) => (Math.abs(current - next) > 1 ? next : current))
    }
  }
  const measured = useRef({ head: 0, body: 0, footer: 0 })

  const overlayOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] })
  const entranceTranslate = progress.interpolate({ inputRange: [0, 1], outputRange: [screenHeight, 0] })

  const previewSource = selected?.type === 'image' ? selected.source : null
  const selectionLabel = previewSource ? 'Imagem de fundo' : 'Sem capa'

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <View style={styles.layer}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={styles.overlayPress} onPress={close} accessibilityRole="button" accessibilityLabel="Fechar" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { height: sheetHeight, transform: [{ translateY: Animated.add(entranceTranslate, dragTranslate) }] },
          ]}
        >
          <View style={styles.dragZone} onLayout={measureCollapsed('head')} {...panResponder.panHandlers}>
            <View style={styles.handle} />
            <Text style={styles.title}>Novo plano</Text>
          </View>

          <View onLayout={measureCollapsed('body')}>
            <View style={styles.formBlock}>
              <View style={styles.previewCard}>
                {previewSource ? (
                  <Image source={previewSource} style={styles.previewCover} resizeMode="cover" />
                ) : (
                  <View style={[styles.previewCover, styles.emptyCover]}>
                    <ImageOff size={26} color={theme.colors.text3} strokeWidth={1.6} />
                  </View>
                )}
                <View style={styles.previewBody}>
                  <Text style={styles.previewName} numberOfLines={1}>{name.trim() || 'Plano sem título'}</Text>
                  <Text style={styles.previewMeta}>Pré-visualização</Text>
                </View>
              </View>

              <Text style={styles.label}>Nome do plano</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex.: Planejamento do trimestre"
                placeholderTextColor={theme.colors.text3}
                style={styles.input}
                selectionColor={theme.colors.text1}
                autoCorrect={false}
              />

              <Text style={styles.label}>Capa</Text>
              <Pressable
                style={styles.coverTrigger}
                onPress={() => (expandedRef.current ? collapse() : expand())}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel="Escolher capa"
              >
                <View style={styles.coverTriggerPreview}>
                  {previewSource ? (
                    <Image source={previewSource} style={styles.coverTriggerImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.coverTriggerImage, styles.emptyCover]}>
                      <ImageOff size={18} color={theme.colors.text3} strokeWidth={1.6} />
                    </View>
                  )}
                </View>
                <View style={styles.coverTriggerText}>
                  <Text style={styles.coverTriggerTitle}>{selectionLabel}</Text>
                  <Text style={styles.coverTriggerHint}>{expanded ? 'Toque para recolher' : 'Toque para escolher'}</Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                  <ChevronDown size={18} color={theme.colors.text3} strokeWidth={1.8} />
                </Animated.View>
              </Pressable>
            </View>
          </View>

          {expanded ? (
            <ScrollView
              style={styles.gallery}
              contentContainerStyle={styles.galleryContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Padrão</Text>
                <View style={styles.thumbGrid}>
                  <Pressable
                    style={[styles.thumb, styles.noneThumb, !selected && styles.selectedOutline]}
                    onPress={() => setSelected(null)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: !selected }}
                    accessibilityLabel="Sem capa"
                  >
                    <ImageOff size={20} color={theme.colors.text3} strokeWidth={1.6} />
                    <Text style={styles.noneThumbLabel}>Sem capa</Text>
                    {!selected ? (
                      <View style={styles.thumbCheck}>
                        <Check size={14} color={theme.colors.textInverse} strokeWidth={2.4} />
                      </View>
                    ) : null}
                  </Pressable>
                </View>
              </View>

              {BACKGROUND_COLLECTIONS.map((collection) => (
                <View key={collection.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{collection.title}</Text>
                  <View style={styles.thumbGrid}>
                    {collection.items.map((item) => {
                      const active = isImageSelected(selected, item.id)
                      return (
                        <Pressable
                          key={item.id}
                          style={[styles.thumb, active && styles.selectedOutline]}
                          onPress={() => setSelected({ type: 'image', id: item.id, source: item.source })}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={item.label}
                        >
                          <Image source={item.source} style={styles.thumbImage} resizeMode="cover" />
                          {active ? (
                            <View style={styles.thumbCheck}>
                              <Check size={14} color={theme.colors.textInverse} strokeWidth={2.4} />
                            </View>
                          ) : null}
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.spacer} />
          )}

          <View style={styles.footer} onLayout={measureCollapsed('footer')}>
            <Pressable
              style={[styles.submit, (!name.trim() || busy) && styles.submitDisabled]}
              onPress={submit}
              disabled={!name.trim() || busy}
              accessibilityRole="button"
            >
              <Text style={[styles.submitText, (!name.trim() || busy) && styles.submitTextDisabled]}>
                {busy ? 'Criando...' : 'Criar plano'}
              </Text>
            </Pressable>
          </View>
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
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
    overflow: 'hidden',
  },
  dragZone: {
    paddingTop: 10,
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    alignSelf: 'center',
    marginBottom: 14,
    borderRadius: 999,
    backgroundColor: theme.colors.border2,
  },
  title: {
    color: theme.colors.text1,
    textAlign: 'center',
    ...theme.type.title,
  },
  formBlock: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 4,
  },
  previewCard: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
    marginBottom: 20,
  },
  previewCover: {
    height: 124,
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  previewBody: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 3,
  },
  previewName: {
    color: theme.colors.text1,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  previewMeta: {
    color: theme.colors.text3,
    fontSize: 12,
  },
  label: {
    color: theme.colors.text3,
    ...theme.type.eyebrow,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border2,
    color: theme.colors.text1,
    fontSize: 15,
    marginBottom: 20,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  coverTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 10,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border2,
    backgroundColor: theme.colors.surface2,
  },
  coverTriggerPreview: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  coverTriggerImage: {
    width: '100%',
    height: '100%',
  },
  coverTriggerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  coverTriggerTitle: {
    color: theme.colors.text1,
    fontSize: 14.5,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  coverTriggerHint: {
    color: theme.colors.text3,
    fontSize: 12.5,
  },
  spacer: {
    flex: 1,
  },
  gallery: {
    flex: 1,
  },
  galleryContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: theme.colors.text2,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginBottom: 12,
  },
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  thumb: {
    width: '31%',
    aspectRatio: 1.35,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  emptyCover: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  noneThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface2,
  },
  noneThumbLabel: {
    color: theme.colors.text3,
    fontSize: 12,
    fontWeight: '500',
  },
  thumbCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text1,
  },
  selectedOutline: {
    borderWidth: 2,
    borderColor: theme.colors.text1,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
  },
  submit: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.text1,
  },
  submitDisabled: {
    backgroundColor: theme.colors.surface3,
  },
  submitText: {
    color: theme.colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
  submitTextDisabled: {
    color: theme.colors.text3,
  },
})

let styles = createStyles(theme)
