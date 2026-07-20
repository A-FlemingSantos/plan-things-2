import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { useAuth } from '../providers/AuthProvider'
import { resolveAuthScreenModeFromRedirect } from '../providers/authSessionPolicy.js'
import { theme } from '../theme/tokens'
import { useMobileTheme, useThemedStyles } from '../theme/ThemeProvider'

const WELCOME_BACKGROUND = require('../../assets/images/welcome-background.jpg')
const WELCOME_SUBTITLE = 'Acompanhe tarefas e conversas sem perder o ritmo.'

function notify(message) {
  if (Platform.OS === 'web') {
    window.alert(message)
    return
  }
  Alert.alert('Plan Things', message)
}

function oauthErrorMessage(errorCode) {
  if (errorCode === 'OAUTH_PROVIDER_ERROR') return 'O provedor cancelou ou recusou o login.'
  if (errorCode === 'OAUTH_CODE_AUSENTE') return 'O provedor nao retornou o codigo de login.'
  if (errorCode === 'ESTADO_OAUTH_EXPIRADO') return 'A validacao do login expirou. Tente novamente.'
  if (errorCode === 'ESTADO_OAUTH_INVALIDO') return 'Nao foi possivel validar este login. Tente novamente.'
  return 'Nao foi possivel concluir o login com o provedor.'
}

function WelcomeFadeBand({ isDark }) {
  const channel = isDark ? '0, 0, 0' : '255, 255, 255'
  return (
    <View style={styles.welcomeFade} pointerEvents="none">
      {Array.from({ length: 18 }, (_, index) => (
        <View
          key={`welcome-fade-${index}`}
          style={[styles.welcomeFadeStep, { backgroundColor: `rgba(${channel}, ${index / 17})` }]}
        />
      ))}
    </View>
  )
}

function SocialRow({ onGoogle, onSoon, loading, iconColor, buttonStyle }) {
  return (
    <View style={styles.socialRow}>
      <Pressable
        style={buttonStyle}
        onPress={onGoogle}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Continuar com o Google"
      >
        <Svg width={22} height={22} viewBox="0 0 48 48">
          <Path
            fill="#FFC107"
            d="M43.61 20.08H42V20H24v8h11.3c-1.65 4.66-6.08 8-11.3 8-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.39-3.92Z"
          />
          <Path
            fill="#FF3D00"
            d="m6.3 14.69 6.57 4.82C14.65 15.11 18.96 12 24 12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 16.32 4 9.66 8.34 6.3 14.69Z"
          />
          <Path
            fill="#4CAF50"
            d="M24 44c5.17 0 9.86-1.98 13.41-5.19l-6.19-5.24C29.21 35.1 26.71 36 24 36c-5.2 0-9.62-3.31-11.29-7.94l-6.52 5.02C9.51 39.56 16.24 44 24 44Z"
          />
          <Path
            fill="#1976D2"
            d="M43.61 20.08H42V20H24v8h11.3a12.04 12.04 0 0 1-4.09 5.57l6.19 5.24C36.97 39.2 44 34 44 24c0-1.34-.14-2.65-.39-3.92Z"
          />
        </Svg>
      </Pressable>

      <Pressable
        style={buttonStyle}
        onPress={onSoon}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Continuar com a Apple"
      >
        <Svg width={22} height={22} viewBox="0 0 16 16">
          <Path
            fill={iconColor}
            d="M11.18.01c-.03-.04-1.26.02-2.32 1.17-1.07 1.16-.9 2.48-.88 2.52.02.03 1.52.09 2.47-1.26.96-1.35.76-2.39.73-2.43Zm3.32 11.73c-.05-.1-2.33-1.23-2.11-3.42.21-2.19 1.67-2.79 1.69-2.86.03-.06-.59-.79-1.25-1.15a3.7 3.7 0 0 0-1.56-.44c-.11 0-.48-.09-1.25.12-.51.14-1.65.59-1.97.61-.32.02-1.26-.52-2.27-.67-.64-.12-1.33.13-1.82.33-.49.19-1.42.75-2.07 2.23-.66 1.49-.31 3.83-.07 4.56.24.73.62 1.93 1.27 2.8.58.98 1.34 1.67 1.66 1.9.32.23 1.22.39 1.84.07.5-.31 1.41-.49 1.77-.47.36.01 1.06.15 1.78.54.57.19 1.11.11 1.65-.11.55-.22 1.33-1.06 2.24-2.76.35-.79.51-1.22.47-1.28Z"
          />
        </Svg>
      </Pressable>

      <Pressable
        style={buttonStyle}
        onPress={onSoon}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Continuar com o telefone"
      >
        <Svg width={20} height={20} viewBox="0 0 16 16">
          <Path
            fill={iconColor}
            d="M3.65 1.33a.68.68 0 0 0-1.01-.06L1.61 2.3C1.12 2.78.94 3.47 1.15 4.07a17.6 17.6 0 0 0 4.17 6.61 17.6 17.6 0 0 0 6.61 4.17c.6.21 1.29.03 1.77-.45l1.03-1.04a.68.68 0 0 0-.06-1.01l-2.3-1.8a.68.68 0 0 0-.58-.12l-2.2.55a1.75 1.75 0 0 1-1.65-.46L5.48 8.06a1.75 1.75 0 0 1-.46-1.65l.55-2.2a.68.68 0 0 0-.12-.58L3.65 1.33Z"
          />
        </Svg>
      </Pressable>
    </View>
  )
}

export default function AuthScreen() {
  styles = useThemedStyles(createStyles)
  const insets = useSafeAreaInsets()
  const { isDark, statusBarStyle, theme: activeTheme } = useMobileTheme()
  const {
    clearOAuthError,
    clearPendingLogoutRedirect,
    login,
    oauthError,
    pendingLogoutRedirect,
    register,
    startOAuthLogin,
  } = useAuth()
  const [mode, setMode] = useState('welcome')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState(null)
  const [loading, setLoading] = useState(false)
  const isRegister = mode === 'register'
  const isWelcome = mode === 'welcome'
  const isForm = mode === 'login' || mode === 'register'

  const panelOpacity = useRef(new Animated.Value(0)).current
  const panelTranslateY = useRef(new Animated.Value(28)).current
  const brandOpacity = useRef(new Animated.Value(0)).current
  const actionsOpacity = useRef(new Animated.Value(0)).current
  const formOpacity = useRef(new Animated.Value(0)).current
  const formTranslateY = useRef(new Animated.Value(16)).current
  const prevModeRef = useRef(mode)

  useEffect(() => {
    if (!pendingLogoutRedirect) return

    const nextMode = resolveAuthScreenModeFromRedirect(pendingLogoutRedirect?.to)
    if (nextMode) {
      setMode(nextMode)
    }

    clearPendingLogoutRedirect()
  }, [clearPendingLogoutRedirect, pendingLogoutRedirect])

  useEffect(() => {
    if (!isWelcome) return

    panelOpacity.setValue(0)
    panelTranslateY.setValue(28)
    brandOpacity.setValue(0)
    actionsOpacity.setValue(0)

    Animated.sequence([
      Animated.parallel([
        Animated.timing(panelOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(panelTranslateY, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      Animated.timing(brandOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(actionsOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start()
  }, [actionsOpacity, brandOpacity, isWelcome, panelOpacity, panelTranslateY])

  useEffect(() => {
    const previous = prevModeRef.current
    prevModeRef.current = mode

    if (!isForm) return

    const enteringFromWelcome = previous === 'welcome'
    if (enteringFromWelcome) {
      formOpacity.setValue(0)
      formTranslateY.setValue(16)
      brandOpacity.setValue(0)
      actionsOpacity.setValue(0)

      Animated.sequence([
        Animated.parallel([
          Animated.timing(formOpacity, { toValue: 1, duration: 340, useNativeDriver: true }),
          Animated.timing(formTranslateY, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]),
        Animated.timing(brandOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(actionsOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start()
      return
    }

    brandOpacity.setValue(0.4)
    actionsOpacity.setValue(0.5)
    Animated.parallel([
      Animated.timing(brandOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(actionsOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start()
  }, [actionsOpacity, brandOpacity, formOpacity, formTranslateY, isForm, mode])

  const submit = async () => {
    if (loading) return
    setLoading(true)
    try {
      if (isRegister) {
        await register({ fullName: name, email, password })
      } else {
        await login({ email, password })
      }
    } catch (error) {
      notify(error?.message ?? 'Nao foi possivel autenticar.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    if (loading) return
    setLoading(true)
    try {
      await startOAuthLogin('google')
    } catch (error) {
      notify(error?.message ?? 'Nao foi possivel iniciar o login com Google.')
    } finally {
      setLoading(false)
    }
  }

  const soon = () => {
    notify('Em breve')
  }

  const goToMode = (nextMode) => {
    if (oauthError) clearOAuthError()
    setMode(nextMode)
  }

  const bottomPad = Math.max(insets.bottom, 20)
  const topPad = Math.max(insets.top, 12)

  if (isWelcome) {
    return (
      <View style={styles.welcomeRoot}>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <ImageBackground
          source={WELCOME_BACKGROUND}
          style={styles.welcomeScreen}
          imageStyle={styles.welcomeBackgroundImage}
          resizeMode="cover"
        >
          <View style={styles.welcomeImageSpacer} />

          <Animated.View
            style={[
              styles.welcomeBottom,
              {
                opacity: panelOpacity,
                transform: [{ translateY: panelTranslateY }],
              },
            ]}
          >
            <WelcomeFadeBand isDark={isDark} />
            <View style={[styles.welcomePanel, { paddingBottom: bottomPad }]}>
              <Animated.View
                collapsable={false}
                style={[styles.welcomeBrand, { opacity: brandOpacity }]}
              >
                <Text
                  style={styles.welcomeTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  Plan Things
                </Text>
                <Text style={styles.welcomeSubtitle}>{WELCOME_SUBTITLE}</Text>
              </Animated.View>

              <Animated.View style={[styles.welcomeActions, { opacity: actionsOpacity }]}>
                <Pressable
                  style={styles.welcomePrimaryButton}
                  onPress={() => goToMode('register')}
                  accessibilityRole="button"
                  accessibilityLabel="Cadastrar-se"
                >
                  <Text style={styles.welcomePrimaryButtonText}>Cadastrar-se</Text>
                </Pressable>

                <View style={styles.welcomeDividerRow}>
                  <View style={styles.welcomeDividerLine} />
                  <Text style={styles.welcomeDividerText}>ou</Text>
                  <View style={styles.welcomeDividerLine} />
                </View>

                <SocialRow
                  onGoogle={handleGoogle}
                  onSoon={soon}
                  loading={loading}
                  iconColor={activeTheme.colors.text1}
                  buttonStyle={styles.welcomeSocialButton}
                />

                <Text style={styles.welcomeLegal}>
                  Ao continuar, você concorda com os{' '}
                  <Text style={styles.welcomeLegalLink} onPress={soon}>
                    Termos de uso
                  </Text>
                  {' '}e a{' '}
                  <Text style={styles.welcomeLegalLink} onPress={soon}>
                    Política de privacidade
                  </Text>
                  .
                </Text>
              </Animated.View>
            </View>
          </Animated.View>
        </ImageBackground>
      </View>
    )
  }

  return (
    <View style={styles.formRoot}>
      <StatusBar style={statusBarStyle} translucent backgroundColor="transparent" />
      <KeyboardAvoidingView
        style={styles.formRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
      >
        <Animated.View
          style={[
            styles.formScreen,
            {
              paddingTop: topPad,
              paddingBottom: bottomPad,
              opacity: formOpacity,
              transform: [{ translateY: formTranslateY }],
            },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formScroll}
            bounces={false}
          >
            <Pressable
              onPress={() => goToMode('welcome')}
              hitSlop={12}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Svg width={18} height={18} viewBox="0 0 16 16">
                <Path
                  fill={activeTheme.colors.text1}
                  d="M10.78 2.22a.75.75 0 0 1 0 1.06L6.06 8l4.72 4.72a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z"
                />
              </Svg>
              <Text style={styles.backText}>Voltar</Text>
            </Pressable>

            <Animated.View
              collapsable={false}
              style={[styles.formBrand, { opacity: brandOpacity }]}
            >
              <Text
                style={styles.formTitle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                Plan Things
              </Text>
              <Text style={styles.formSubtitle}>
                {isRegister
                  ? 'Crie sua conta e organize o que importa.'
                  : 'Entre para retomar suas tarefas e conversas.'}
              </Text>
            </Animated.View>

            {oauthError ? (
              <View style={styles.oauthError}>
                <Text style={styles.oauthErrorText}>{oauthErrorMessage(oauthError)}</Text>
                <Pressable onPress={clearOAuthError} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.oauthErrorDismiss}>Fechar</Text>
                </Pressable>
              </View>
            ) : null}

            <Animated.View style={[styles.formBody, { opacity: actionsOpacity }]}>
              <View style={styles.fields}>
                {isRegister ? (
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.input, focusedField === 'name' ? styles.inputFocused : null]}
                    selectionColor={activeTheme.colors.text1}
                    autoCapitalize="words"
                    placeholder="Nome completo"
                    placeholderTextColor={activeTheme.colors.text3}
                    editable={!loading}
                  />
                ) : null}
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={[styles.input, focusedField === 'email' ? styles.inputFocused : null]}
                  selectionColor={activeTheme.colors.text1}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="E-mail"
                  placeholderTextColor={activeTheme.colors.text3}
                  editable={!loading}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={[styles.input, focusedField === 'password' ? styles.inputFocused : null]}
                  selectionColor={activeTheme.colors.text1}
                  secureTextEntry
                  placeholder={isRegister ? 'Senha, mínimo 8 caracteres' : 'Senha'}
                  placeholderTextColor={activeTheme.colors.text3}
                  editable={!loading}
                />
              </View>

              <Pressable
                style={[styles.formPrimaryButton, loading ? styles.formPrimaryButtonDisabled : null]}
                onPress={submit}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={isRegister ? 'Cadastrar-se' : 'Entrar'}
              >
                <Text style={styles.formPrimaryButtonText}>
                  {loading ? 'Aguarde…' : isRegister ? 'Cadastrar-se' : 'Entrar'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.modeSwitch}
                onPress={() => goToMode(isRegister ? 'login' : 'register')}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.modeSwitchText}>
                  {isRegister ? 'Já possui uma conta? ' : 'Ainda não possui uma conta? '}
                  <Text style={styles.modeSwitchLink}>{isRegister ? 'Entrar' : 'Cadastrar-se'}</Text>
                </Text>
              </Pressable>

              <View style={styles.formDividerRow}>
                <View style={styles.formDividerLine} />
                <Text style={styles.formDividerText}>ou</Text>
                <View style={styles.formDividerLine} />
              </View>

              <SocialRow
                onGoogle={handleGoogle}
                onSoon={soon}
                loading={loading}
                iconColor={activeTheme.colors.text1}
                buttonStyle={styles.formSocialButton}
              />
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
  welcomeRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    ...(Platform.OS === 'web' ? { minHeight: '100dvh' } : null),
  },
  welcomeScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    ...(Platform.OS === 'web' ? { minHeight: '100dvh' } : null),
  },
  welcomeBackgroundImage: {
    width: '100%',
    height: '100%',
  },
  welcomeImageSpacer: {
    flex: 1,
  },
  welcomeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
  welcomeFade: {
    height: 72,
    width: '100%',
  },
  welcomeFadeStep: {
    flex: 1,
    width: '100%',
  },
  welcomePanel: {
    backgroundColor: theme.colors.appBg,
    paddingHorizontal: 28,
    paddingTop: 8,
    width: '100%',
  },
  welcomeBrand: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    marginBottom: 36,
    gap: 10,
  },
  welcomeTitle: {
    alignSelf: 'stretch',
    color: theme.colors.text1,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  welcomeSubtitle: {
    color: theme.colors.text2,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    maxWidth: 300,
  },
  welcomeActions: {
    gap: 22,
  },
  welcomePrimaryButton: {
    width: '100%',
    height: 54,
    borderRadius: 999,
    backgroundColor: theme.colors.text1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomePrimaryButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  welcomeDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  welcomeDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border1,
  },
  welcomeDividerText: {
    color: theme.colors.text2,
    fontSize: 14,
    fontWeight: '500',
  },
  welcomeSocialButton: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeLegal: {
    color: theme.colors.text3,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  welcomeLegalLink: {
    color: theme.colors.text1,
    textDecorationLine: 'underline',
  },

  formRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.appBg,
    ...(Platform.OS === 'web' ? { minHeight: '100dvh' } : null),
  },
  formScreen: {
    flex: 1,
    paddingHorizontal: 28,
  },
  formScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 12,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  backText: {
    color: theme.colors.text2,
    fontSize: 15,
    fontWeight: '500',
  },
  formBrand: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    marginBottom: 32,
    gap: 10,
  },
  formTitle: {
    alignSelf: 'stretch',
    color: theme.colors.text1,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  formSubtitle: {
    color: theme.colors.text2,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    maxWidth: 320,
  },
  formBody: {
    gap: 18,
  },
  fields: {
    gap: 12,
  },
  input: {
    height: 54,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    borderRadius: 999,
    color: theme.colors.text1,
    backgroundColor: theme.colors.appBg,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  inputFocused: {
    borderColor: theme.colors.text1,
    ...(Platform.OS === 'web'
      ? { outlineColor: theme.colors.text1, outlineStyle: 'solid', outlineWidth: 1 }
      : null),
  },
  formPrimaryButton: {
    width: '100%',
    height: 54,
    borderRadius: 999,
    backgroundColor: theme.colors.text1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formPrimaryButtonDisabled: {
    opacity: 0.7,
  },
  formPrimaryButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  modeSwitch: {
    alignItems: 'center',
    paddingVertical: 2,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  modeSwitchText: {
    color: theme.colors.text2,
    fontSize: 14,
    textAlign: 'center',
  },
  modeSwitchLink: {
    color: theme.colors.text1,
    fontWeight: '700',
  },
  formDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  formDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border1,
  },
  formDividerText: {
    color: theme.colors.text2,
    fontSize: 14,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  formSocialButton: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oauthError: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
    borderRadius: 18,
    backgroundColor: theme.colors.dangerBgSoft,
    marginBottom: 18,
  },
  oauthErrorText: {
    color: theme.colors.red,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  oauthErrorDismiss: {
    color: theme.colors.text1,
    fontSize: 12,
    fontWeight: '700',
  },
})

let styles = createStyles(theme)
