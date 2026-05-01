import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import {
  AlarmClock,
  AtSign,
  BellRing,
  Building2,
  CalendarClock,
  ChevronRight,
  Download,
  KeyRound,
  Languages,
  Laptop,
  Link,
  LogOut,
  Mail,
  Newspaper,
  Palette,
  Shield,
  Smartphone,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react-native'
import BottomSheet from '../components/BottomSheet'
import { theme } from '../theme/tokens'

function SectionCard({ title, hint, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {hint ? <Text style={styles.cardHint}>{hint}</Text> : null}
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  )
}

function Row({ icon: Icon, label, hint, value, onPress, right, danger = false, disabled = false }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ disabled: disabled || !onPress }}
      style={({ pressed }) => [
        styles.row,
        danger && styles.rowDanger,
        (disabled || !onPress) && styles.rowDisabled,
        pressed && onPress ? styles.rowPressed : null,
      ]}
    >
      {Icon ? (
        <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
          <Icon size={16} color={danger ? theme.colors.red : theme.colors.text2} strokeWidth={1.9} />
        </View>
      ) : null}

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]} numberOfLines={1}>
            {label}
          </Text>
          {value ? (
            <Text style={[styles.rowValue, danger && styles.rowValueDanger]} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
        </View>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>

      {right ? <View style={styles.rowRight}>{right}</View> : onPress ? (
        <ChevronRight size={16} color={theme.colors.text3} strokeWidth={1.8} />
      ) : null}
    </Pressable>
  )
}

function Pill({ label, tone = 'neutral' }) {
  const toneStyle = tone === 'danger' ? styles.pillDanger : tone === 'accent' ? styles.pillAccent : styles.pillNeutral
  const toneTextStyle = tone === 'danger' ? styles.pillTextDanger : tone === 'accent' ? styles.pillTextAccent : styles.pillTextNeutral
  return (
    <View style={[styles.pill, toneStyle]}>
      <Text style={[styles.pillText, toneTextStyle]} numberOfLines={1}>{label}</Text>
    </View>
  )
}

function InlineButton({ label, onPress, tone = 'secondary', disabled = false }) {
  const buttonStyle = tone === 'danger' ? styles.btnDanger : tone === 'primary' ? styles.btnPrimary : styles.btnSecondary
  const textStyle = tone === 'danger' ? styles.btnDangerText : tone === 'primary' ? styles.btnPrimaryText : styles.btnSecondaryText
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.btnBase,
        buttonStyle,
        disabled && styles.btnDisabled,
        pressed && !disabled ? styles.btnPressed : null,
      ]}
    >
      <Text style={textStyle} numberOfLines={1}>{label}</Text>
    </Pressable>
  )
}

export default function SettingsScreen({ session, onLogout }) {
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(true)
  const [mentionsEnabled, setMentionsEnabled] = useState(true)
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [productNewsEnabled, setProductNewsEnabled] = useState(false)
  const [activeSheet, setActiveSheet] = useState(null)

  const firstName = useMemo(() => session.user.fullName.split(' ')[0] ?? session.user.fullName, [session.user.fullName])
  const workspaceInitial = useMemo(() => session.workspace.initial ?? (session.workspace.name?.[0] ?? 'W'), [session.workspace.initial, session.workspace.name])
  const closeSheet = () => setActiveSheet(null)

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topbar}>
        <View style={styles.topbarText}>
          <Text style={styles.pageTitle}>Ajustes</Text>
          <Text style={styles.pageSubtitle}>Olá, {firstName}. Personalize sua experiência.</Text>
        </View>
      </View>

      <View style={styles.identityCard}>
        <View style={styles.identityAvatar}>
          <Text style={styles.identityAvatarText}>{session.user.initials}</Text>
        </View>
        <View style={styles.identityBody}>
          <Text style={styles.identityName} numberOfLines={1}>{session.user.fullName}</Text>
          <Text style={styles.identityEmail} numberOfLines={1}>{session.user.email}</Text>
          <View style={styles.identityMetaRow}>
            <View style={styles.workspaceBadge}>
              <Text style={styles.workspaceBadgeText}>{workspaceInitial}</Text>
            </View>
            <Text style={styles.identityWorkspace} numberOfLines={1}>{session.workspace.name}</Text>
          </View>
        </View>
        <Pill label="demo" />
      </View>

      <SectionCard
        title="Conta"
        hint="Informações de perfil, sessão e acesso."
      >
        <Row
          icon={UserRound}
          label="Perfil"
          hint="Nome, foto e preferências da conta."
          value="Gerenciar"
          onPress={() => setActiveSheet('profile')}
        />
        <Row
          icon={KeyRound}
          label="Senha"
          hint="Recomendado: senha forte + gerenciador."
          right={<InlineButton label="Alterar" onPress={() => setActiveSheet('password')} />}
        />
        <Row
          icon={LogOut}
          label="Sair"
          hint="Encerra a sessão do modo dev neste dispositivo."
          danger
          onPress={onLogout}
        />
      </SectionCard>

      <SectionCard
        title="Preferências gerais"
        hint="Idioma, formatação e comportamento do app."
      >
        <Row
          icon={Languages}
          label="Idioma"
          hint="Define o idioma da interface."
          value="Português (Brasil)"
          onPress={() => setActiveSheet('language')}
        />
        <Row
          icon={CalendarClock}
          label="Fuso horário"
          hint="Usado em datas de tarefas e lembretes."
          value="Automático"
          onPress={() => setActiveSheet('timezone')}
        />
        <Row
          icon={Palette}
          label="Tema"
          hint="Aparência do app."
          right={<Pill label="Em breve" tone="accent" />}
          disabled
        />
      </SectionCard>

      <SectionCard
        title="Workspace"
        hint="Configurações do seu espaço de trabalho."
      >
        <Row
          icon={Building2}
          label="Workspace atual"
          hint="Onde seus planos e arquivos ficam organizados."
          value={session.workspace.name}
          onPress={() => setActiveSheet('workspace')}
        />
        <Row
          icon={Users}
          label="Membros e permissões"
          hint="Convites, funções e acesso."
          right={<Pill label="Em breve" />}
          disabled
        />
      </SectionCard>

      <SectionCard
        title="Integrações"
        hint="Conecte serviços para automatizar sua caixa de entrada."
      >
        <Row
          icon={Mail}
          label="Gmail"
          hint="Importe mensagens e envie resumos."
          right={<InlineButton label="Conectar" onPress={() => setActiveSheet('gmail')} />}
        />
        <Row
          icon={Link}
          label="Calendário"
          hint="Sincronize eventos e deadlines."
          right={<Pill label="Em breve" />}
          disabled
        />
      </SectionCard>

      <SectionCard
        title="Notificações"
        hint="Controle quando o app chama sua atenção."
      >
        <Row
          icon={BellRing}
          label="Resumo diário"
          hint="Receba um resumo com pendências do dia."
          right={(
            <Switch
              value={dailySummaryEnabled}
              onValueChange={setDailySummaryEnabled}
              trackColor={{ false: theme.colors.border2, true: theme.colors.text1 }}
              thumbColor={theme.colors.white}
              ios_backgroundColor={theme.colors.border2}
            />
          )}
        />
        <Row
          icon={AtSign}
          label="Menções"
          hint="Quando alguém mencionar você em uma tarefa."
          right={(
            <Switch
              value={mentionsEnabled}
              onValueChange={setMentionsEnabled}
              trackColor={{ false: theme.colors.border2, true: theme.colors.text1 }}
              thumbColor={theme.colors.white}
              ios_backgroundColor={theme.colors.border2}
            />
          )}
        />
        <Row
          icon={AlarmClock}
          label="Lembretes de prazos"
          hint="Alertas para tarefas próximas do vencimento."
          right={(
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ false: theme.colors.border2, true: theme.colors.text1 }}
              thumbColor={theme.colors.white}
              ios_backgroundColor={theme.colors.border2}
            />
          )}
        />
        <Row
          icon={Newspaper}
          label="Novidades do produto"
          hint="Atualizações e notas de versão."
          right={(
            <Switch
              value={productNewsEnabled}
              onValueChange={setProductNewsEnabled}
              trackColor={{ false: theme.colors.border2, true: theme.colors.text1 }}
              thumbColor={theme.colors.white}
              ios_backgroundColor={theme.colors.border2}
            />
          )}
        />
      </SectionCard>

      <SectionCard
        title="Privacidade e segurança"
        hint="Proteção de conta e controle de dados."
      >
        <Row
          icon={Shield}
          label="Autenticação em dois fatores"
          hint="Adicione uma camada extra de proteção."
          right={<Pill label="Em breve" tone="accent" />}
          disabled
        />
        <Row
          icon={Laptop}
          label="Sessões ativas"
          hint="Gerencie dispositivos conectados."
          right={<Pill label="Em breve" />}
          disabled
        />
        <Row
          icon={Download}
          label="Exportar meus dados"
          hint="Baixe uma cópia completa das suas informações."
          right={<InlineButton label="Exportar" onPress={() => setActiveSheet('export')} />}
        />
        <Row
          icon={Smartphone}
          label="Encerrar outras sessões"
          hint="Invalida sessões abertas em outros dispositivos."
          right={<InlineButton label="Encerrar" onPress={() => setActiveSheet('sessions')} />}
        />

        <View style={styles.dangerZone}>
          <View style={styles.dangerCopy}>
            <Text style={styles.dangerTitle}>Zona de perigo</Text>
            <Text style={styles.dangerHint}>
              Ações permanentes e irreversíveis. Use com cuidado.
            </Text>
          </View>
          <View style={styles.dangerRow}>
            <View style={styles.dangerRowMeta}>
              <Trash2 size={16} color={theme.colors.red} strokeWidth={1.9} />
              <View style={styles.dangerRowText}>
                <Text style={styles.dangerRowTitle}>Excluir conta</Text>
                <Text style={styles.dangerRowHint} numberOfLines={2}>
                  Remove definitivamente planos, arquivos e histórico do workspace.
                </Text>
              </View>
            </View>
            <InlineButton label="Excluir" tone="danger" onPress={() => setActiveSheet('delete')} />
          </View>
        </View>
      </SectionCard>

      <BottomSheet
        visible={Boolean(activeSheet)}
        onClose={closeSheet}
        title={
          activeSheet === 'profile' ? 'Perfil' :
          activeSheet === 'password' ? 'Senha' :
          activeSheet === 'language' ? 'Idioma' :
          activeSheet === 'timezone' ? 'Fuso horário' :
          activeSheet === 'workspace' ? 'Workspace' :
          activeSheet === 'gmail' ? 'Gmail' :
          activeSheet === 'export' ? 'Exportar dados' :
          activeSheet === 'sessions' ? 'Sessões' :
          activeSheet === 'delete' ? 'Excluir conta' :
          'Ajustes'
        }
      >
        {activeSheet === 'profile' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetTitle}>{session.user.fullName}</Text>
            <Text style={styles.sheetHint}>{session.user.email}</Text>
            <View style={styles.sheetDivider} />
            <Text style={styles.sheetBodyText}>
              Esta é uma versão demo do Ajustes mobile. Em um app completo, você poderia alterar nome, foto e preferências da conta.
            </Text>
            <View style={styles.sheetActions}>
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'language' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetBodyText}>Idioma atual: Português (Brasil).</Text>
            <View style={styles.sheetDivider} />
            <View style={styles.sheetOption}>
              <Pill label="Selecionado" />
              <Text style={styles.sheetOptionText}>Português (Brasil)</Text>
            </View>
            <View style={styles.sheetOption}>
              <Pill label="Em breve" tone="accent" />
              <Text style={styles.sheetOptionText}>English (US)</Text>
            </View>
            <View style={styles.sheetActions}>
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'timezone' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetBodyText}>
              O app usa o fuso do dispositivo para exibir datas e horários. Em breve, você poderá definir manualmente.
            </Text>
            <View style={styles.sheetActions}>
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'workspace' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetTitle}>{session.workspace.name}</Text>
            <Text style={styles.sheetHint}>Workspace atual</Text>
            <View style={styles.sheetDivider} />
            <Text style={styles.sheetBodyText}>
              Em breve: convites, permissões e gestão de membros direto do mobile.
            </Text>
            <View style={styles.sheetActions}>
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'gmail' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetTitle}>Integração com Gmail</Text>
            <Text style={styles.sheetHint}>Conecte para enviar resumos e organizar a Inbox.</Text>
            <View style={styles.sheetDivider} />
            <Text style={styles.sheetBodyText}>
              Em breve: fluxo de conexão OAuth, escolha de labels e sincronização com sua Caixa de Entrada.
            </Text>
            <View style={styles.sheetActions}>
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}

        {activeSheet === 'password' || activeSheet === 'export' || activeSheet === 'sessions' || activeSheet === 'delete' ? (
          <View style={styles.sheetBlock}>
            <Text style={styles.sheetBodyText}>
              Ação disponível em uma atualização futura. Esta tela já segue a mesma estrutura e linguagem do Ajustes do web, adaptada para mobile.
            </Text>
            <View style={styles.sheetActions}>
              <InlineButton label="Fechar" tone="secondary" onPress={closeSheet} />
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  content: {
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 20,
    paddingBottom: 98,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 14,
  },
  topbarText: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    color: theme.colors.text1,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '400',
  },
  pageSubtitle: {
    color: theme.colors.text3,
    fontSize: 13,
    marginTop: 2,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    marginBottom: theme.spacing.section,
  },
  identityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text1,
  },
  identityAvatarText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  identityBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  identityName: {
    color: theme.colors.text1,
    fontSize: 16,
    fontWeight: '700',
  },
  identityEmail: {
    color: theme.colors.text2,
    fontSize: 13,
  },
  identityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  workspaceBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface3,
    borderWidth: 1,
    borderColor: theme.colors.border1,
  },
  workspaceBadgeText: {
    color: theme.colors.text2,
    fontSize: 11,
    fontWeight: '700',
  },
  identityWorkspace: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text3,
    fontSize: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 12,
    backgroundColor: theme.colors.surface1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
  },
  cardTitle: {
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '700',
  },
  cardHint: {
    color: theme.colors.text3,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  cardBody: {
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
  },
  rowPressed: {
    opacity: 0.92,
  },
  rowDisabled: {
    opacity: 0.65,
  },
  rowDanger: {
    borderBottomColor: '#ffd3d3',
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface3,
  },
  rowIconDanger: {
    borderWidth: 1,
    borderColor: '#ffd3d3',
    backgroundColor: '#fff5f5',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowLabel: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  rowLabelDanger: {
    color: theme.colors.red,
  },
  rowValue: {
    color: theme.colors.text3,
    fontSize: 12,
    fontWeight: '600',
  },
  rowValueDanger: {
    color: theme.colors.red,
  },
  rowHint: {
    color: theme.colors.text2,
    fontSize: 12,
    lineHeight: 16,
  },
  rowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillNeutral: {
    backgroundColor: theme.colors.surface3,
    borderColor: theme.colors.border1,
  },
  pillTextNeutral: {
    color: theme.colors.text2,
  },
  pillAccent: {
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border1,
  },
  pillTextAccent: {
    color: theme.colors.text1,
  },
  pillDanger: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffd3d3',
  },
  pillTextDanger: {
    color: theme.colors.red,
  },
  btnBase: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.92,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimary: {
    backgroundColor: theme.colors.text1,
  },
  btnPrimaryText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: theme.colors.surface3,
    borderWidth: 1,
    borderColor: theme.colors.border1,
  },
  btnSecondaryText: {
    color: theme.colors.text1,
    fontSize: 12,
    fontWeight: '700',
  },
  btnDanger: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffd3d3',
  },
  btnDangerText: {
    color: theme.colors.red,
    fontSize: 12,
    fontWeight: '800',
  },
  dangerZone: {
    paddingTop: 14,
    paddingBottom: 14,
  },
  dangerCopy: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffd3d3',
    backgroundColor: '#fffafa',
  },
  dangerTitle: {
    color: theme.colors.red,
    fontSize: 13,
    fontWeight: '800',
  },
  dangerHint: {
    color: theme.colors.text2,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  dangerRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffd3d3',
    backgroundColor: '#fffafa',
  },
  dangerRowMeta: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dangerRowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  dangerRowTitle: {
    color: theme.colors.text1,
    fontSize: 13,
    fontWeight: '800',
  },
  dangerRowHint: {
    color: theme.colors.text2,
    fontSize: 12,
    lineHeight: 16,
  },
  sheetBlock: {
    gap: 8,
    paddingBottom: 6,
  },
  sheetTitle: {
    color: theme.colors.text1,
    fontSize: 18,
    fontWeight: '700',
  },
  sheetHint: {
    color: theme.colors.text3,
    fontSize: 13,
  },
  sheetBodyText: {
    color: theme.colors.text2,
    fontSize: 14,
    lineHeight: 19,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: theme.colors.border1,
    marginTop: 6,
    marginBottom: 6,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface2,
  },
  sheetOptionText: {
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '600',
  },
})
