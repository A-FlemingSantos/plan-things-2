import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowRight } from 'lucide-react-native'
import LogoMark from '../components/LogoMark'
import { theme } from '../theme/tokens'

export default function AuthScreen({ onEnter }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('Arthur Santos')
  const [email, setEmail] = useState('arthur@example.com')
  const [password, setPassword] = useState('')
  const isRegister = mode === 'register'

  const submit = () => {
    onEnter(mode, { name, email, password })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.page}>
        <View style={styles.top}>
          <View style={styles.brand}>
            <LogoMark size={32} />
            <Text style={styles.brandText}>Plan Things</Text>
          </View>
          <Pressable onPress={() => setMode(isRegister ? 'login' : 'register')} hitSlop={10}>
            <Text style={styles.switchTop}>{isRegister ? 'Entrar' : 'Cadastro'}</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>{isRegister ? 'Novo por aqui' : 'Bem-vindo de volta'}</Text>
            <Text style={styles.title}>{isRegister ? 'Crie sua conta.' : 'Entre na sua conta.'}</Text>
          </View>

          <View style={styles.form}>
            {isRegister ? (
              <View style={styles.field}>
                <Text style={styles.label}>Nome completo</Text>
                <TextInput value={name} onChangeText={setName} style={styles.input} autoCapitalize="words" />
              </View>
            ) : null}
            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
                placeholder={isRegister ? 'Mínimo 8 caracteres' : 'Digite qualquer valor'}
                placeholderTextColor={theme.colors.text3}
              />
            </View>
          </View>

          <Pressable style={styles.primaryButton} onPress={submit}>
            <Text style={styles.primaryButtonText}>{isRegister ? 'Criar conta dev' : 'Entrar no app'}</Text>
            <ArrowRight size={17} color={theme.colors.white} strokeWidth={1.8} />
          </Pressable>

          <Pressable style={styles.devButton} onPress={submit}>
            <Text style={styles.devButtonText}>Entrar em modo dev</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Demo-first · sem API real nesta base</Text>
      </KeyboardAvoidingView>
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
  top: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandText: {
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '500',
  },
  switchTop: {
    color: theme.colors.text2,
    fontSize: 13,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 26,
    paddingBottom: 34,
  },
  heading: {
    gap: 8,
  },
  eyebrow: {
    color: theme.colors.text3,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text1,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '400',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 7,
  },
  label: {
    color: theme.colors.text2,
    fontSize: 13,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: theme.radius.md,
    color: theme.colors.text1,
    backgroundColor: theme.colors.surface1,
    fontSize: 15,
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
  devButton: {
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonText: {
    color: theme.colors.text2,
    fontSize: 14,
  },
  footer: {
    color: theme.colors.text3,
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 14,
  },
})
