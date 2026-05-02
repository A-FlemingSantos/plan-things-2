import { useState } from 'react'
import { Alert, Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Rect } from 'react-native-svg'
import { useAuth } from '../providers/AuthProvider'
import { theme } from '../theme/tokens'

const nextStepsImage = require('../../assets/illustrations/Next steps-pana-graphite.png')

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

export default function AuthScreen() {
  const { clearOAuthError, login, oauthError, register, startOAuthLogin } = useAuth()
  const [mode, setMode] = useState('welcome')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState(null)
  const [loading, setLoading] = useState(false)
  const isRegister = mode === 'register'
  const isWelcome = mode === 'welcome'

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        {isWelcome ? (
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeHero}>
              <View style={styles.welcomeBrand}>
                <Text style={styles.welcomeBrandText}>Plan Things</Text>
              </View>
              <Image source={nextStepsImage} style={styles.heroImage} resizeMode="contain" />
            </View>

            <View style={styles.welcomeActions}>
              <Text style={styles.welcomeSlogan}>Acompanhe tarefas e conversas sem perder o ritmo.</Text>
              <Pressable style={[styles.primaryButton, styles.welcomeButton]} onPress={() => setMode('register')}>
                <Text style={styles.primaryButtonText}>Cadastrar-se</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, styles.welcomeButton, styles.welcomeSecondaryButton]}
                onPress={() => setMode('login')}
              >
                <Text style={styles.secondaryButtonText}>Entrar</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.authContent}>
            <Pressable onPress={() => setMode('welcome')} hitSlop={10} style={styles.backButton}>
              <Text style={styles.switchTop}>Voltar</Text>
            </Pressable>

            <View style={styles.authBrand}>
              <Text style={styles.authBrandText}>Plan Things</Text>
            </View>

            <View style={styles.authHeading}>
              <Text style={styles.authTitle}>{isRegister ? 'Comece sua rotina.' : 'Bem-vindo\nde volta!'}</Text>
            </View>

            {oauthError ? (
              <View style={styles.oauthError}>
                <Text style={styles.oauthErrorText}>{oauthErrorMessage(oauthError)}</Text>
                <Pressable onPress={clearOAuthError} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.oauthErrorDismiss}>Fechar</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.form}>
              {isRegister ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  style={[styles.input, focusedField === 'name' ? styles.inputFocused : null]}
                  selectionColor={theme.colors.text1}
                  autoCapitalize="words"
                  placeholder="Nome completo"
                  placeholderTextColor={theme.colors.text3}
                />
              ) : null}
              <TextInput
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={[styles.input, focusedField === 'email' ? styles.inputFocused : null]}
                selectionColor={theme.colors.text1}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="E-mail"
                placeholderTextColor={theme.colors.text3}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={[styles.input, focusedField === 'password' ? styles.inputFocused : null]}
                selectionColor={theme.colors.text1}
                secureTextEntry
                placeholder={isRegister ? 'Senha, mínimo 8 caracteres' : 'Senha'}
                placeholderTextColor={theme.colors.text3}
              />
            </View>

            <Pressable style={styles.authPrimaryButton} onPress={submit}>
              <Text style={styles.primaryButtonText}>{isRegister ? 'Cadastrar-se' : 'Entrar'}</Text>
            </Pressable>

            <Pressable style={styles.inlineSwitch} onPress={() => setMode(isRegister ? 'login' : 'register')}>
              <Text style={styles.inlineSwitchText}>
                {isRegister ? 'Já possui uma conta? ' : 'Ainda não possui uma conta? '}
                <Text style={styles.inlineSwitchLink}>{isRegister ? 'Entrar' : 'Cadastrar-se'}</Text>
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.providerList}>
              <Pressable style={styles.providerButton} onPress={handleGoogle}>
                <View style={styles.providerIcon}>
                  <Svg width={21} height={21} viewBox="0 0 48 48">
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
                </View>
                <Text style={styles.providerText}>Continuar com o Google</Text>
              </Pressable>
              <Pressable style={styles.providerButton} onPress={soon}>
                <View style={styles.providerIcon}>
                  <Svg width={21} height={21} viewBox="0 0 23 23">
                    <Rect x="1" y="1" width="10" height="10" fill="#F25022" />
                    <Rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                    <Rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                    <Rect x="12" y="12" width="10" height="10" fill="#FFB900" />
                  </Svg>
                </View>
                <Text style={styles.providerText}>Continuar com a Microsoft</Text>
              </Pressable>
              <Pressable style={styles.providerButton} onPress={soon}>
                <View style={styles.providerIcon}>
                  <Svg width={21} height={21} viewBox="0 0 16 16">
                    <Path
                      fill={theme.colors.black}
                      d="M11.18.01c-.03-.04-1.26.02-2.32 1.17-1.07 1.16-.9 2.48-.88 2.52.02.03 1.52.09 2.47-1.26.96-1.35.76-2.39.73-2.43Zm3.32 11.73c-.05-.1-2.33-1.23-2.11-3.42.21-2.19 1.67-2.79 1.69-2.86.03-.06-.59-.79-1.25-1.15a3.7 3.7 0 0 0-1.56-.44c-.11 0-.48-.09-1.25.12-.51.14-1.65.59-1.97.61-.32.02-1.26-.52-2.27-.67-.64-.12-1.33.13-1.82.33-.49.19-1.42.75-2.07 2.23-.66 1.49-.31 3.83-.07 4.56.24.73.62 1.93 1.27 2.8.58.98 1.34 1.67 1.66 1.9.32.23 1.22.39 1.84.07.5-.31 1.41-.49 1.77-.47.36.01 1.06.15 1.78.54.57.19 1.11.11 1.65-.11.55-.22 1.33-1.06 2.24-2.76.35-.79.51-1.22.47-1.28Z"
                    />
                  </Svg>
                </View>
                <Text style={styles.providerText}>Continuar com a Apple</Text>
              </Pressable>
              <Pressable style={styles.providerButton} onPress={soon}>
                <View style={styles.providerIcon}>
                  <Svg width={20} height={20} viewBox="0 0 16 16">
                    <Path
                      fill={theme.colors.black}
                      d="M3.65 1.33a.68.68 0 0 0-1.01-.06L1.61 2.3C1.12 2.78.94 3.47 1.15 4.07a17.6 17.6 0 0 0 4.17 6.61 17.6 17.6 0 0 0 6.61 4.17c.6.21 1.29.03 1.77-.45l1.03-1.04a.68.68 0 0 0-.06-1.01l-2.3-1.8a.68.68 0 0 0-.58-.12l-2.2.55a1.75 1.75 0 0 1-1.65-.46L5.48 8.06a1.75 1.75 0 0 1-.46-1.65l.55-2.2a.68.68 0 0 0-.12-.58L3.65 1.33Z"
                    />
                  </Svg>
                </View>
                <Text style={styles.providerText}>Continuar com o telefone</Text>
              </Pressable>
            </View>
          </View>
        )}

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  page: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenX,
  },
  switchTop: {
    color: theme.colors.text2,
    fontSize: 13,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 52,
    paddingBottom: 42,
  },
  welcomeHero: {
    alignItems: 'center',
    flexShrink: 0,
  },
  welcomeBrand: {
    justifyContent: 'center',
    marginBottom: 8,
  },
  welcomeBrandText: {
    color: theme.colors.text1,
    fontSize: 17,
    fontWeight: '600',
  },
  heroImage: {
    width: '122%',
    height: 420,
    alignSelf: 'center',
  },
  welcomeActions: {
    gap: 12,
    paddingBottom: 48,
    marginTop: 'auto',
  },
  welcomeButton: {
    width: '92%',
    height: 44,
    borderRadius: theme.radius.sm,
    alignSelf: 'center',
  },
  welcomeSecondaryButton: {
    borderColor: theme.colors.border2,
  },
  welcomeSlogan: {
    color: theme.colors.text1,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  authContent: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 380,
    justifyContent: 'center',
    paddingTop: 36,
    paddingBottom: 28,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 0,
    zIndex: 1,
  },
  authBrand: {
    alignItems: 'center',
    marginBottom: 36,
  },
  authBrandText: {
    color: theme.colors.text1,
    fontSize: 17,
    fontWeight: '600',
  },
  authHeading: {
    alignItems: 'center',
    marginBottom: 26,
    paddingHorizontal: 10,
  },
  authTitle: {
    color: theme.colors.text1,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '400',
    textAlign: 'center',
  },
  oauthError: {
    width: '92%',
    alignSelf: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ffd3d3',
    borderRadius: theme.radius.sm,
    backgroundColor: '#fff5f5',
    marginBottom: 14,
  },
  oauthErrorText: {
    color: theme.colors.red,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  oauthErrorDismiss: {
    color: theme.colors.red,
    fontSize: 12,
    fontWeight: '800',
  },
  form: {
    gap: 12,
    marginBottom: 20,
    width: '92%',
    alignSelf: 'center',
  },
  input: {
    height: 52,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    borderRadius: theme.radius.sm,
    color: theme.colors.text1,
    backgroundColor: theme.colors.surface1,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  inputFocused: {
    borderColor: theme.colors.text1,
    borderWidth: 2,
    ...(Platform.OS === 'web'
      ? { outlineColor: theme.colors.text1, outlineStyle: 'solid', outlineWidth: 1 }
      : null),
  },
  primaryButton: {
    height: 50,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.text1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  authPrimaryButton: {
    width: '92%',
    height: 44,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.text1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  secondaryButton: {
    height: 50,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '600',
  },
  inlineSwitch: {
    alignItems: 'center',
    marginBottom: 22,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  inlineSwitchText: {
    color: theme.colors.text2,
    fontSize: 14,
    textAlign: 'center',
  },
  inlineSwitchLink: {
    color: theme.colors.text1,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border1,
  },
  dividerText: {
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '500',
  },
  providerList: {
    gap: 9,
    width: '92%',
    alignSelf: 'center',
  },
  providerButton: {
    height: 50,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 14,
    shadowColor: theme.colors.black,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  providerIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerText: {
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  footer: {
    color: theme.colors.text3,
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 14,
  },
})
