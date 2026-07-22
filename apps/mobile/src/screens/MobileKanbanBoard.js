import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Keyboard,
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
import * as DocumentPicker from 'expo-document-picker'
import {
  AlignLeft,
  ArrowLeft,
  Check,
  CheckSquare,
  ChevronDown,
  Clock3,
  Copy,
  FileText,
  MessageCircle,
  MoreHorizontal,
  Kanban,
  ListChecks,
  Paperclip,
  Plus,
  Send,
  Star,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AuthenticatedAvatar from '../components/AuthenticatedAvatar'
import BottomSheet from '../components/BottomSheet'
import { useFiles } from '../providers/FilesProvider'
import { usePlans } from '../providers/PlansProvider'
import { buildTaskCompletionPatch, isLegacyDoneColumn, isTaskDone } from './mobileTaskCompletion'
import { interactivePointerEventsStyle, shouldUseNativeDriver, withPlatformPointerEvents } from '../theme/platformRuntime'
import { theme } from '../theme/tokens'
import { useThemedStyles } from '../theme/ThemeProvider'

let boardLabels = []
let boardMembers = []
const EMPTY_COLUMNS = []

function findLabel(labelId) {
  return boardLabels.find((label) => label.id === labelId) ?? null
}

function findMembers(memberIds = []) {
  return memberIds
    .map((memberId) => boardMembers.find((member) => member.id === memberId))
    .filter(Boolean)
}

function isDoneColumn(column) {
  return isLegacyDoneColumn(column)
}

function MemberAvatar({ member, style, textStyle, fallback = 'PT' }) {
  return (
    <AuthenticatedAvatar
      style={[style, { backgroundColor: member?.color ?? theme.colors.black }]}
      textStyle={textStyle}
      avatarUrl={member?.avatarUrl}
      fallback={member?.initials ?? fallback}
      accessibilityLabel={member?.name ? `Avatar de ${member.name}` : 'Avatar de membro'}
    />
  )
}

function cloneBoardColumns(columns = []) {
  return columns.map((column) => ({
    ...column,
    cards: column.cards.map((card) => ({
      ...card,
      memberIds: [...(card.memberIds ?? [])],
      comments: [...(card.comments ?? [])],
      attachments: [...(card.attachments ?? [])],
      checklists: (card.checklists ?? []).map((checklist) => ({
        ...checklist,
        items: [...(checklist.items ?? [])],
      })),
    })),
  }))
}

function findCardEntry(columns = [], cardId) {
  for (const column of columns) {
    const card = column.cards.find((item) => item.id === cardId)
    if (card) return { card, column }
  }

  return null
}

function createLocalCard(title) {
  return {
    id: `mobile-card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    columnId: null,
    description: '',
    isCompleted: false,
    completed: false,
    starred: false,
    labelId: null,
    memberIds: [],
    dueDate: '',
    schedule: normalizeSchedule(),
    comments: [],
    attachments: [],
    checklists: [],
  }
}

function createLocalColumn(title, index = 0) {
  const columnColors = [theme.colors.blue, theme.colors.green, theme.colors.purple, theme.colors.red, theme.colors.text1]

  return {
    id: `mobile-column-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    color: columnColors[index % columnColors.length],
    cards: [],
  }
}

function padDatePart(value) {
  return String(value).padStart(2, '0')
}

function dateValueFromDate(date) {
  return `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}/${date.getFullYear()}`
}

function parseDateValue(value) {
  const match = String(value ?? '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
  return Number.isNaN(date.getTime()) ? null : date
}

function formatShortDateLabel(value) {
  const date = parseDateValue(value)
  if (!date) return ''
  return `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}`
}

function buildCalendarDays(anchorDate, selectedValue) {
  const firstOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  const cursor = new Date(firstOfMonth)
  cursor.setDate(firstOfMonth.getDate() - firstOfMonth.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(cursor)
    date.setDate(cursor.getDate() + index)
    const value = dateValueFromDate(date)
    return {
      date,
      value,
      day: date.getDate(),
      muted: date.getMonth() !== anchorDate.getMonth(),
      selected: selectedValue === value,
    }
  })
}

function normalizeSchedule(source = {}, legacyDueDate = '') {
  const fallbackDueDate = source.dueDateValue || ''
  const dueEnabled = Boolean(source.dueEnabled || fallbackDueDate)
  const startEnabled = Boolean(source.startEnabled || source.startDateValue)
  const dueDateValue = dueEnabled ? fallbackDueDate : ''
  const startDateValue = startEnabled ? (source.startDateValue || dueDateValue) : ''

  return {
    selectedCalendarDay: source.selectedCalendarDay || dueDateValue || startDateValue || null,
    startEnabled,
    startDateValue,
    dueEnabled,
    dueDateValue,
    dueTimeValue: source.dueTimeValue ?? '',
    displayLabel: source.displayLabel || (dueDateValue ? formatShortDateLabel(dueDateValue) : legacyDueDate),
    preserveDisplayLabel: false,
  }
}

function normalizeAttachment(attachment = {}) {
  return {
    ...attachment,
    id: attachment.id ?? attachment.fileId ?? `attachment-${Date.now()}`,
    name: attachment.name ?? 'Arquivo',
    addedAt: attachment.addedAt ?? attachment.createdAt?.text ?? 'agora',
  }
}

function isUserComment(comment = {}) {
  return comment.kind !== 'ASSIGNEE_ACTIVITY'
}

function BoardCard({ card, onPress }) {
  const label = findLabel(card.labelId)
  const members = findMembers(card.memberIds)
  const dueLabel = card.dueDate || card.schedule?.displayLabel
  const commentCount = (card.comments ?? []).filter(isUserComment).length
  const hasMeta = Boolean(dueLabel || commentCount || members.length)

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir cartão ${card.title}`}
    >
      {label ? (
        <View style={[styles.cardLabel, { backgroundColor: label.color }]}>
          <Text style={styles.cardLabelText}>{label.text}</Text>
        </View>
      ) : null}

      <Text style={styles.cardTitle} numberOfLines={3}>{card.title}</Text>
      {card.description ? (
        <Text style={styles.cardDescription} numberOfLines={2}>{card.description}</Text>
      ) : null}

      {hasMeta ? (
        <View style={styles.cardFooter}>
          <View style={styles.cardMeta}>
            {dueLabel ? (
              <View style={styles.metaPill}>
                <Clock3 size={12} color={theme.colors.text2} strokeWidth={1.8} />
                <Text style={styles.metaText}>{dueLabel}</Text>
              </View>
            ) : null}
            {commentCount ? (
              <View style={styles.metaPill}>
                <MessageCircle size={12} color={theme.colors.text2} strokeWidth={1.8} />
                <Text style={styles.metaText}>{commentCount}</Text>
              </View>
            ) : null}
          </View>

          {members.length ? (
            <View style={styles.memberStack}>
              {members.slice(0, 3).map((member) => (
                <MemberAvatar
                  key={member.id}
                  member={member}
                  style={styles.memberAvatar}
                  textStyle={styles.memberInitials}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  )
}

function DetailAction({ icon: Icon, label, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.detailAction, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Icon size={15} color={theme.colors.text1} strokeWidth={1.8} />
      <Text style={styles.detailActionText}>{label}</Text>
    </Pressable>
  )
}

function DetailSectionAction({ disabled = false, icon: Icon = Plus, label, onPress }) {
  return (
    <Pressable
      style={[styles.detailSectionAction, disabled && styles.detailSectionActionDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Icon size={14} color={disabled ? theme.colors.text3 : theme.colors.text1} strokeWidth={1.8} />
      <Text style={[styles.detailSectionActionText, disabled && styles.detailSectionActionTextDisabled]}>{label}</Text>
    </Pressable>
  )
}

function DetailSecondaryAction({ icon: Icon = Plus, label, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.detailSecondaryAction, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Icon size={14} color={theme.colors.text2} strokeWidth={1.8} />
      <Text style={styles.detailSecondaryActionText}>{label}</Text>
    </Pressable>
  )
}

function CardDetailScreen({
  card,
  column,
  columns,
  files,
  planFiles,
  onAttachFile,
  onClose,
  onDeleteCard,
  onDuplicateCard,
  onMoveCard,
  onRemoveAttachment,
  onUpdateCard,
  onUploadFile,
}) {
  const [savedDescription, setSavedDescription] = useState(card.description ?? '')
  const [descriptionValue, setDescriptionValue] = useState(savedDescription)
  const [labelId, setLabelId] = useState(card.labelId ?? null)
  const [memberIds, setMemberIds] = useState(card.memberIds ?? [])
  const [schedule, setSchedule] = useState(() => normalizeSchedule(card.schedule, card.dueDate))
  const [calendarAnchor, setCalendarAnchor] = useState(() => (
    parseDateValue(card.schedule?.dueDateValue || card.schedule?.startDateValue) ?? new Date()
  ))
  const [comments, setComments] = useState(Array.isArray(card.comments) ? card.comments : [])
  const [commentValue, setCommentValue] = useState('')
  const [attachments, setAttachments] = useState(Array.isArray(card.attachments) ? card.attachments.map(normalizeAttachment) : [])
  const [checklists, setChecklists] = useState(Array.isArray(card.checklists) ? card.checklists : [])
  const [checklistInput, setChecklistInput] = useState('')
  const [attachmentError, setAttachmentError] = useState(null)
  const [activeSheet, setActiveSheet] = useState(null)
  const slideProgress = useRef(new Animated.Value(1)).current
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const label = findLabel(labelId)
  const members = findMembers(memberIds)
  const hasDescriptionChanges = descriptionValue !== savedDescription
  const dueDate = schedule.dueEnabled ? (schedule.displayLabel || formatShortDateLabel(schedule.dueDateValue)) : ''
  const selectedCalendarValue = schedule.dueEnabled ? schedule.dueDateValue : schedule.startDateValue
  const calendarDays = useMemo(
    () => buildCalendarDays(calendarAnchor, selectedCalendarValue),
    [calendarAnchor, selectedCalendarValue],
  )
  const availablePlanFiles = useMemo(() => (
    (planFiles ?? []).filter((file) => file.type !== 'folder' && !file.trashed)
  ), [planFiles])
  const availableLibraryFiles = useMemo(() => (
    (files ?? []).filter((file) => file.type !== 'folder' && !file.trashed)
  ), [files])
  const visibleComments = useMemo(() => comments.filter(isUserComment), [comments])
  const translateY = slideProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  })

  useEffect(() => {
    const nextDescription = card.description ?? ''
    setSavedDescription(nextDescription)
    setDescriptionValue(nextDescription)
    setCommentValue('')
    setChecklistInput('')
    setAttachmentError(null)
    setActiveSheet(null)
  }, [card.id])

  useEffect(() => {
    const nextSchedule = normalizeSchedule(card.schedule, card.dueDate)
    const nextCalendarAnchor = parseDateValue(nextSchedule.dueDateValue || nextSchedule.startDateValue)

    setLabelId(card.labelId ?? null)
    setMemberIds(card.memberIds ?? [])
    setSchedule(nextSchedule)
    if (nextCalendarAnchor) {
      setCalendarAnchor(nextCalendarAnchor)
    }
    setComments(Array.isArray(card.comments) ? card.comments : [])
    setAttachments(Array.isArray(card.attachments) ? card.attachments.map(normalizeAttachment) : [])
    setChecklists(Array.isArray(card.checklists) ? card.checklists : [])
  }, [card.attachments, card.checklists, card.comments, card.dueDate, card.id, card.labelId, card.memberIds, card.schedule])

  useEffect(() => {
    Animated.timing(slideProgress, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: shouldUseNativeDriver,
    }).start()
  }, [slideProgress])

  const close = () => {
    Animated.timing(slideProgress, {
      toValue: 1,
      duration: 210,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: shouldUseNativeDriver,
    }).start(({ finished }) => {
      if (finished) {
        onClose()
      }
    })
  }

  const concludeDescriptionEdit = () => {
    setSavedDescription(descriptionValue)
    onUpdateCard(card.id, { description: descriptionValue })
    Keyboard.dismiss()
  }

  const commitCardPatch = (patch) => {
    onUpdateCard(card.id, patch)
  }

  const toggleMember = (memberId) => {
    const nextMemberIds = memberIds.includes(memberId)
      ? memberIds.filter((id) => id !== memberId)
      : [...memberIds, memberId]

    setMemberIds(nextMemberIds)
    commitCardPatch({ memberIds: nextMemberIds })
  }

  const selectLabel = (nextLabelId) => {
    setLabelId(nextLabelId)
    commitCardPatch({ labelId: nextLabelId })
    setActiveSheet(null)
  }

  const commitSchedule = (nextSchedule) => {
    const normalized = normalizeSchedule(nextSchedule)
    setSchedule(normalized)
    commitCardPatch({
      dueDate: normalized.dueEnabled ? (normalized.displayLabel || formatShortDateLabel(normalized.dueDateValue)) : '',
      schedule: normalized,
    })
  }

  const toggleScheduleFlag = (field) => {
    setSchedule((current) => {
      const today = dateValueFromDate(new Date())
      const enabledKey = field === 'start' ? 'startEnabled' : 'dueEnabled'
      const valueKey = field === 'start' ? 'startDateValue' : 'dueDateValue'
      const nextEnabled = !current[enabledKey]
      const next = {
        ...current,
        [enabledKey]: nextEnabled,
        [valueKey]: nextEnabled ? (current[valueKey] || current.dueDateValue || current.startDateValue || today) : '',
      }

      if (nextEnabled) {
        const nextDate = parseDateValue(next[valueKey])
        if (nextDate) setCalendarAnchor(nextDate)
      }

      return normalizeSchedule(next)
    })
  }

  const selectCalendarDate = (value) => {
    setSchedule((current) => {
      const editingDue = current.dueEnabled || !current.startEnabled
      return normalizeSchedule({
        ...current,
        [editingDue ? 'dueEnabled' : 'startEnabled']: true,
        [editingDue ? 'dueDateValue' : 'startDateValue']: value,
        selectedCalendarDay: value,
        displayLabel: editingDue ? formatShortDateLabel(value) : current.displayLabel,
      })
    })
  }

  const saveSchedule = () => {
    commitSchedule(schedule)
    setActiveSheet(null)
  }

  const clearSchedule = () => {
    const emptySchedule = normalizeSchedule()
    setSchedule(emptySchedule)
    commitCardPatch({ dueDate: '', schedule: emptySchedule })
    setActiveSheet(null)
  }

  const ensureChecklist = () => {
    if (checklists.length) return checklists

    return [{
      id: `checklist-${Date.now()}`,
      title: 'Checklist',
      items: [],
    }]
  }

  const addChecklistItem = () => {
    const text = checklistInput.trim()
    const baseChecklists = ensureChecklist()
    if (!text && checklists.length) return

    const nextChecklists = baseChecklists.map((checklist, index) => (
      index === 0
        ? {
            ...checklist,
            items: text
              ? [
                  ...(checklist.items ?? []),
                  {
                    id: `item-${Date.now()}`,
                    title: text,
                    text,
                    completed: false,
                    checked: false,
                  },
                ]
              : checklist.items,
          }
        : checklist
    ))

    setChecklists(nextChecklists)
    setChecklistInput('')
    commitCardPatch({ checklists: nextChecklists })
  }

  const toggleChecklistItem = (itemId) => {
    const nextChecklists = checklists.map((checklist) => ({
      ...checklist,
      items: (checklist.items ?? []).map((item) => (
        item.id === itemId
          ? {
              ...item,
              checked: !Boolean(item.checked ?? item.completed),
              completed: !Boolean(item.checked ?? item.completed),
            }
          : item
      )),
    }))

    setChecklists(nextChecklists)
    commitCardPatch({ checklists: nextChecklists })
  }

  const attachLibraryFile = async (file) => {
    if (!file) return
    setAttachmentError(null)
    const optimistic = normalizeAttachment({
      id: `attachment-${file.id}`,
      fileId: file.id,
      name: file.name,
      source: 'library',
      addedAt: 'agora',
      canRemove: false,
    })
    setAttachments((current) => (
      current.some((attachment) => attachment.fileId === file.id)
        ? current
        : [...current, optimistic]
    ))
    setActiveSheet(null)
    try {
      await onAttachFile(card.id, file)
    } catch (error) {
      setAttachmentError(error?.message ?? 'Nao foi possivel anexar o arquivo.')
      setAttachments((current) => current.filter((attachment) => attachment.id !== optimistic.id))
    }
  }

  const uploadDeviceAttachment = async () => {
    setAttachmentError(null)
    let optimisticId = null
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
      const asset = result.assets?.[0]
      if (!asset) return
      const optimistic = normalizeAttachment({
        id: `attachment-upload-${Date.now()}`,
        name: asset.name,
        source: 'device',
        addedAt: 'agora',
        canRemove: false,
      })
      optimisticId = optimistic.id
      setAttachments((current) => [...current, optimistic])
      setActiveSheet(null)
      await onUploadFile(card.id, asset)
    } catch (error) {
      setAttachmentError(error?.message ?? 'Nao foi possivel enviar o arquivo.')
      if (optimisticId) {
        setAttachments((current) => current.filter((attachment) => attachment.id !== optimisticId))
      }
    }
  }

  const removeAttachmentItem = async (attachment) => {
    setAttachmentError(null)
    const previousAttachments = attachments
    setAttachments((current) => current.filter((item) => item.id !== attachment.id))
    try {
      await onRemoveAttachment(card.id, attachment)
    } catch (error) {
      setAttachmentError(error?.message ?? 'Nao foi possivel remover o anexo.')
      setAttachments(previousAttachments)
    }
  }

  const sendComment = () => {
    const text = commentValue.trim()
    if (!text) return

    const nextComments = [
      {
        id: `comment-${Date.now()}`,
        author: 'm1',
        kind: 'USER_COMMENT',
        text,
        time: 'agora',
      },
      ...comments,
    ]

    setComments(nextComments)
    setCommentValue('')
    commitCardPatch({ comments: nextComments })
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <Animated.View style={[styles.detailScreen, { transform: [{ translateY }] }]}>
        <View style={[styles.detailTopbar, { paddingTop: Math.max(insets.top, 12) }]}>
          <Pressable
            style={({ pressed }) => [styles.detailIconButton, pressed && styles.cardPressed]}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Fechar cartão"
            hitSlop={8}
          >
            <X size={18} color={theme.colors.text1} strokeWidth={1.8} />
          </Pressable>
          <Text style={styles.detailTopbarTitle} numberOfLines={1}>Cartão</Text>
          <Pressable
            style={({ pressed }) => [styles.detailIconButton, pressed && styles.cardPressed]}
            onPress={() => setActiveSheet('more')}
            accessibilityRole="button"
            accessibilityLabel="Mais opções"
            hitSlop={8}
          >
            <MoreHorizontal size={18} color={theme.colors.text1} strokeWidth={1.8} />
          </Pressable>
        </View>

        <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailHero}>
            <Text style={styles.detailEyebrow}>{column.title}</Text>
            <Text style={styles.detailTitle}>{card.title}</Text>
            {label ? (
              <View style={styles.detailLabelRow}>
                <View style={[styles.detailLabelDot, { backgroundColor: label.color }]} />
                <Text style={styles.detailLabelText}>{label.text}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.detailMetaGrid}>
            <View style={styles.detailMetaItem}>
              <Text style={styles.detailMetaLabel}>Membros</Text>
              {members.length ? (
                <View style={styles.detailMemberRow}>
                  {members.map((member) => (
                    <MemberAvatar
                      key={member.id}
                      member={member}
                      style={styles.detailMemberAvatar}
                      textStyle={styles.detailMemberInitials}
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.detailMetaEmpty}>Sem membros</Text>
              )}
            </View>

            <View style={styles.detailMetaItem}>
              <Text style={styles.detailMetaLabel}>Data</Text>
              <Text style={styles.detailDueText}>{dueDate || 'Sem data'}</Text>
            </View>
          </View>

          <View style={styles.detailActionGrid}>
            <DetailAction icon={Users} label="Membros" onPress={() => setActiveSheet('members')} />
            <DetailAction icon={Tag} label="Etiquetas" onPress={() => setActiveSheet('labels')} />
            <DetailAction icon={Clock3} label="Data" onPress={() => setActiveSheet('date')} />
            <DetailAction icon={CheckSquare} label="Checklist" onPress={() => setActiveSheet('checklist')} />
            <DetailAction icon={Paperclip} label="Anexo" onPress={() => setActiveSheet('attachments')} />
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <View style={styles.detailSectionTitleWrap}>
                <AlignLeft size={16} color={theme.colors.text1} strokeWidth={1.8} />
                <Text style={styles.detailSectionTitle}>Descrição</Text>
              </View>
              <DetailSectionAction
                disabled={!hasDescriptionChanges}
                icon={CheckSquare}
                label="Salvar"
                onPress={concludeDescriptionEdit}
              />
            </View>
            <TextInput
              style={styles.detailDescriptionInput}
              value={descriptionValue}
              onChangeText={setDescriptionValue}
              multiline
              textAlignVertical="top"
              placeholder="Adicionar descrição…"
              placeholderTextColor={theme.colors.text3}
              accessibilityLabel="Descrição do cartão"
            />
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <View style={styles.detailSectionTitleWrap}>
                <Paperclip size={17} color={theme.colors.text1} strokeWidth={1.8} />
                <Text style={styles.detailSectionTitle}>Anexos</Text>
              </View>
              <DetailSectionAction icon={Paperclip} label="Adicionar" onPress={() => setActiveSheet('attachments')} />
            </View>
            <View style={styles.detailInfoRow}>
              <Text style={styles.detailInfoText}>
                {attachments.length ? `${attachments.length} arquivo(s) anexado(s)` : 'Nenhum arquivo anexado a este cartão.'}
              </Text>
            </View>
            {attachmentError ? <Text style={styles.detailInlineError}>{attachmentError}</Text> : null}
            {attachments.length ? (
              <View style={styles.detailAttachmentList}>
                {attachments.map((attachment) => (
                  <View key={attachment.id} style={styles.detailAttachmentItem}>
                    <FileText size={14} color={theme.colors.text1} strokeWidth={1.8} />
                    <Text style={styles.detailAttachmentName} numberOfLines={1}>{attachment.name}</Text>
                    <Text style={styles.detailAttachmentTime}>{attachment.addedAt ?? 'agora'}</Text>
                    {attachment.canRemove !== false ? (
                      <Pressable
                        style={styles.detailAttachmentRemove}
                        onPress={() => removeAttachmentItem(attachment)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remover anexo ${attachment.name}`}
                      >
                        <X size={13} color={theme.colors.text2} strokeWidth={2} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.detailSecondaryActions}>
              <DetailSecondaryAction icon={Paperclip} label="Biblioteca" onPress={() => setActiveSheet('attachment-library')} />
              <DetailSecondaryAction icon={Plus} label="Meu dispositivo" onPress={uploadDeviceAttachment} />
            </View>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <View style={styles.detailSectionTitleWrap}>
                <CheckSquare size={17} color={theme.colors.text1} strokeWidth={1.8} />
                <Text style={styles.detailSectionTitle}>Checklist</Text>
              </View>
              <DetailSectionAction icon={CheckSquare} label="Adicionar" onPress={() => setActiveSheet('checklist')} />
            </View>
            <View style={styles.detailInfoRow}>
              <Text style={styles.detailInfoText}>
                {checklists.length ? `${checklists.length} checklist(s) neste cartão` : 'Nenhum checklist criado ainda.'}
              </Text>
            </View>
            {checklists.length ? (
              <View style={styles.detailChecklistList}>
                {checklists[0].items?.length ? checklists[0].items.map((item) => {
                  const done = Boolean(item.checked ?? item.completed)
                  return (
                    <Pressable
                      key={item.id}
                      style={styles.detailChecklistItem}
                      onPress={() => toggleChecklistItem(item.id)}
                      accessibilityRole="button"
                    >
                      <View style={[styles.detailChecklistCheck, done && styles.detailChecklistCheckDone]}>
                        {done ? <Check size={11} color={theme.colors.textInverse} strokeWidth={2.1} /> : null}
                      </View>
                      <Text style={[styles.detailChecklistText, done && styles.detailChecklistTextDone]} numberOfLines={1}>
                        {item.text ?? item.title}
                      </Text>
                    </Pressable>
                  )
                }) : (
                  <Text style={styles.detailEmptyText}>Checklist criado. Adicione o primeiro item.</Text>
                )}
              </View>
            ) : null}
            <View style={styles.detailSecondaryActions}>
              <DetailSecondaryAction icon={CheckSquare} label="Criar checklist" onPress={addChecklistItem} />
              <DetailSecondaryAction icon={Plus} label="Adicionar item" onPress={() => setActiveSheet('checklist')} />
            </View>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <View style={styles.detailSectionTitleWrap}>
                <MessageCircle size={17} color={theme.colors.text1} strokeWidth={1.8} />
                <Text style={styles.detailSectionTitle}>Comentários e atividade</Text>
              </View>
            </View>

            <View style={styles.detailComposer}>
              <TextInput
                style={styles.detailCommentInput}
                value={commentValue}
                onChangeText={setCommentValue}
                placeholder="Escrever comentário..."
                placeholderTextColor={theme.colors.text3}
              />
              <Pressable
                style={[styles.detailSendButton, !commentValue.trim() && styles.detailSendButtonDisabled]}
                onPress={sendComment}
                disabled={!commentValue.trim()}
                accessibilityRole="button"
                accessibilityLabel="Enviar comentário"
                accessibilityState={{ disabled: !commentValue.trim() }}
              >
                <Send size={15} color={commentValue.trim() ? theme.colors.textInverse : theme.colors.text3} strokeWidth={1.9} />
              </Pressable>
            </View>

            <View style={styles.detailActivityList}>
              {visibleComments.length ? (
                visibleComments.map((comment) => {
                  const authorId = comment.authorId ?? comment.author
                  const author = boardMembers.find((member) => member.id === authorId)
                  const presenter = author ?? {
                    id: authorId ?? comment.id,
                    name: comment.authorName ?? comment.author ?? 'Membro',
                    initials: comment.authorName?.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'PT',
                    avatarUrl: comment.authorAvatarUrl ?? null,
                    color: theme.colors.black,
                  }

                  return (
                    <View key={comment.id} style={styles.detailActivityItem}>
                      <MemberAvatar
                        member={presenter}
                        style={styles.detailActivityAvatar}
                        textStyle={styles.detailActivityInitials}
                      />
                      <View style={styles.detailActivityBody}>
                        <Text style={styles.detailActivityText}>
                          <Text style={styles.detailActivityAuthor}>{presenter.initials ?? 'Membro'} </Text>
                          {comment.text}
                        </Text>
                        <Text style={styles.detailActivityTime}>{comment.time}</Text>
                      </View>
                    </View>
                  )
                })
              ) : (
                <Text style={styles.detailEmptyText}>Nenhum comentário registrado neste cartão ainda.</Text>
              )}
            </View>
          </View>
        </ScrollView>

        <BottomSheet visible={Boolean(activeSheet)} onClose={() => setActiveSheet(null)} title={
          activeSheet === 'more' ? 'Opções do cartão'
            : activeSheet === 'members' ? 'Membros'
              : activeSheet === 'labels' ? 'Etiquetas'
                : activeSheet === 'date' ? 'Data'
                  : activeSheet === 'checklist' ? 'Checklist'
                    : activeSheet === 'move' ? 'Mover cartão'
                      : activeSheet === 'attachment-library' ? 'Selecionar arquivo'
                        : 'Anexo'
        }>
          {activeSheet === 'more' ? (
            <View style={styles.sheetActionList}>
              <Pressable style={styles.sheetActionRow} onPress={() => setActiveSheet('move')} accessibilityRole="button">
                <Kanban size={18} color={theme.colors.text1} strokeWidth={1.8} />
                <Text style={styles.sheetActionText}>Mover</Text>
              </Pressable>
              <Pressable
                style={styles.sheetActionRow}
                onPress={() => {
                  onDuplicateCard(card.id)
                  setActiveSheet(null)
                }}
                accessibilityRole="button"
              >
                <Copy size={18} color={theme.colors.text1} strokeWidth={1.8} />
                <Text style={styles.sheetActionText}>Copiar</Text>
              </Pressable>
              <Pressable
                style={[styles.sheetActionRow, styles.sheetActionDanger]}
                onPress={() => {
                  onDeleteCard(card.id)
                  setActiveSheet(null)
                  close()
                }}
                accessibilityRole="button"
              >
                <Trash2 size={18} color={theme.colors.red} strokeWidth={1.8} />
                <Text style={[styles.sheetActionText, styles.sheetActionDangerText]}>Excluir</Text>
              </Pressable>
            </View>
          ) : null}

          {activeSheet === 'move' ? (
            <View style={styles.sheetActionList}>
              {columns.map((targetColumn) => (
                <Pressable
                  key={targetColumn.id}
                  style={styles.sheetActionRow}
                  onPress={() => {
                    onMoveCard(card.id, targetColumn.id)
                    setActiveSheet(null)
                    close()
                  }}
                  accessibilityRole="button"
                >
                  <View style={[styles.sheetColorDot, { backgroundColor: targetColumn.color }]} />
                  <Text style={styles.sheetActionText}>{targetColumn.title}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {activeSheet === 'members' ? (
            <View style={styles.sheetChipList}>
              {boardMembers.map((member) => {
                const isSelected = memberIds.includes(member.id)
                return (
                  <Pressable
                    key={member.id}
                    style={[styles.sheetMemberRow, isSelected && styles.sheetMemberRowActive]}
                    onPress={() => toggleMember(member.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <MemberAvatar
                      member={member}
                      style={styles.detailMemberAvatar}
                      textStyle={styles.detailMemberInitials}
                    />
                    <Text style={styles.sheetActionText}>{member.initials}</Text>
                    {isSelected ? <Check size={16} color={theme.colors.text1} strokeWidth={2} /> : null}
                  </Pressable>
                )
              })}
            </View>
          ) : null}

          {activeSheet === 'labels' ? (
            <View style={styles.sheetChipList}>
              {boardLabels.map((item) => {
                const isSelected = labelId === item.id
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.sheetLabelOption, { backgroundColor: item.color }]}
                    onPress={() => selectLabel(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={styles.sheetLabelText}>{item.text}</Text>
                    {isSelected ? <Check size={16} color={theme.colors.white} strokeWidth={2} /> : null}
                  </Pressable>
                )
              })}
            </View>
          ) : null}

          {activeSheet === 'date' ? (
            <View style={styles.scheduleEditor}>
              <View style={styles.scheduleToggleList}>
                <Pressable style={styles.scheduleToggleRow} onPress={() => toggleScheduleFlag('start')} accessibilityRole="checkbox" accessibilityState={{ checked: schedule.startEnabled }}>
                  <View style={[styles.scheduleCheckbox, schedule.startEnabled && styles.scheduleCheckboxChecked]}>
                    {schedule.startEnabled ? <Check size={12} color={theme.colors.textInverse} strokeWidth={2.2} /> : null}
                  </View>
                  <View style={styles.scheduleToggleText}>
                    <Text style={styles.scheduleToggleLabel}>Início</Text>
                    <Text style={styles.scheduleToggleHint}>{schedule.startDateValue || 'Sem data de início'}</Text>
                  </View>
                </Pressable>
                <Pressable style={styles.scheduleToggleRow} onPress={() => toggleScheduleFlag('due')} accessibilityRole="checkbox" accessibilityState={{ checked: schedule.dueEnabled }}>
                  <View style={[styles.scheduleCheckbox, schedule.dueEnabled && styles.scheduleCheckboxChecked]}>
                    {schedule.dueEnabled ? <Check size={12} color={theme.colors.textInverse} strokeWidth={2.2} /> : null}
                  </View>
                  <View style={styles.scheduleToggleText}>
                    <Text style={styles.scheduleToggleLabel}>Prazo</Text>
                    <Text style={styles.scheduleToggleHint}>{schedule.dueDateValue || 'Sem prazo'}</Text>
                  </View>
                </Pressable>
              </View>

              <View style={styles.calendarHeader}>
                <Pressable
                  style={styles.calendarNavButton}
                  onPress={() => setCalendarAnchor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Mês anterior"
                >
                  <Text style={styles.calendarNavText}>{'<'}</Text>
                </Pressable>
                <Text style={styles.calendarTitle}>
                  {calendarAnchor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </Text>
                <Pressable
                  style={styles.calendarNavButton}
                  onPress={() => setCalendarAnchor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Próximo mês"
                >
                  <Text style={styles.calendarNavText}>{'>'}</Text>
                </Pressable>
              </View>

              <View style={styles.calendarGrid}>
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((weekday, index) => (
                  <Text key={`${weekday}-${index}`} style={styles.calendarWeekday}>{weekday}</Text>
                ))}
                {calendarDays.map((day) => (
                  <Pressable
                    key={day.value}
                    style={[
                      styles.calendarDay,
                      day.muted && styles.calendarDayMuted,
                      day.selected && styles.calendarDaySelected,
                    ]}
                    onPress={() => selectCalendarDate(day.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: day.selected }}
                  >
                    <Text style={[styles.calendarDayText, day.muted && styles.calendarDayTextMuted, day.selected && styles.calendarDayTextSelected]}>
                      {day.day}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={schedule.dueTimeValue}
                onChangeText={(value) => setSchedule((current) => normalizeSchedule({ ...current, dueTimeValue: value }))}
                placeholder="Hora do prazo, ex.: 17:30"
                placeholderTextColor={theme.colors.text3}
                style={styles.sheetInput}
                selectionColor={theme.colors.text1}
                keyboardType="numbers-and-punctuation"
              />
              <View style={styles.sheetButtonRow}>
                <Pressable style={styles.sheetSecondaryButton} onPress={clearSchedule} accessibilityRole="button">
                  <Text style={styles.sheetSecondaryButtonText}>Remover</Text>
                </Pressable>
                <Pressable style={styles.sheetPrimaryButton} onPress={saveSchedule} accessibilityRole="button">
                  <Text style={styles.sheetPrimaryButtonText}>Salvar</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {activeSheet === 'checklist' ? (
            <View>
              <TextInput
                value={checklistInput}
                onChangeText={setChecklistInput}
                placeholder="Novo item"
                placeholderTextColor={theme.colors.text3}
                style={styles.sheetInput}
                selectionColor={theme.colors.text1}
              />
              <Pressable style={styles.sheetPrimaryButton} onPress={addChecklistItem} accessibilityRole="button">
                <Text style={styles.sheetPrimaryButtonText}>{checklists.length ? 'Adicionar item' : 'Criar checklist'}</Text>
              </Pressable>
            </View>
          ) : null}

          {activeSheet === 'attachments' ? (
            <View style={styles.sheetActionList}>
              <Pressable style={styles.sheetActionRow} onPress={() => setActiveSheet('attachment-library')} accessibilityRole="button">
                <Paperclip size={18} color={theme.colors.text1} strokeWidth={1.8} />
                <Text style={styles.sheetActionText}>Biblioteca</Text>
              </Pressable>
              <Pressable style={styles.sheetActionRow} onPress={uploadDeviceAttachment} accessibilityRole="button">
                <Plus size={18} color={theme.colors.text1} strokeWidth={1.8} />
                <Text style={styles.sheetActionText}>Meu dispositivo</Text>
              </Pressable>
            </View>
          ) : null}

          {activeSheet === 'attachment-library' ? (
            <ScrollView style={styles.attachmentPickerScroll} contentContainerStyle={styles.attachmentPickerContent}>
              <Text style={styles.attachmentPickerSectionTitle}>Plano</Text>
              {availablePlanFiles.length ? availablePlanFiles.map((file) => (
                <Pressable
                  key={`plan-${file.id}`}
                  style={styles.attachmentPickerRow}
                  onPress={() => attachLibraryFile(file)}
                  accessibilityRole="button"
                >
                  <FileText size={16} color={theme.colors.text1} strokeWidth={1.8} />
                  <View style={styles.attachmentPickerBody}>
                    <Text style={styles.attachmentPickerName} numberOfLines={1}>{file.name}</Text>
                    <Text style={styles.attachmentPickerMeta}>{file.sizeLabel || file.modified || 'Arquivo do plano'}</Text>
                  </View>
                </Pressable>
              )) : (
                <Text style={styles.detailEmptyText}>Nenhum arquivo do plano disponível.</Text>
              )}

              <Text style={styles.attachmentPickerSectionTitle}>Biblioteca</Text>
              {availableLibraryFiles.length ? availableLibraryFiles.map((file) => (
                <Pressable
                  key={`library-${file.id}`}
                  style={styles.attachmentPickerRow}
                  onPress={() => attachLibraryFile(file)}
                  accessibilityRole="button"
                >
                  <FileText size={16} color={theme.colors.text1} strokeWidth={1.8} />
                  <View style={styles.attachmentPickerBody}>
                    <Text style={styles.attachmentPickerName} numberOfLines={1}>{file.name}</Text>
                    <Text style={styles.attachmentPickerMeta}>{file.sizeLabel || file.modified || 'Arquivo da biblioteca'}</Text>
                  </View>
                </Pressable>
              )) : (
                <Text style={styles.detailEmptyText}>Nenhum arquivo da biblioteca disponível.</Text>
              )}
            </ScrollView>
          ) : null}
        </BottomSheet>
      </Animated.View>
    </Modal>
  )
}

function BoardColumn({ column, width, onAddCard, onLayout, onOpenCard, ...accessibilityProps }) {
  return (
    <View style={[styles.columnPage, { width }]} onLayout={onLayout} {...accessibilityProps}>
      <View style={styles.column}>
        <View style={styles.columnHeader}>
          <View style={styles.columnTitleWrap}>
            <View style={[styles.columnDot, { backgroundColor: column.color }]} />
            <Text style={styles.columnTitle}>{column.title}</Text>
            <Text style={styles.columnCount}>{column.cards.length}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.columnAction, pressed && styles.cardPressed]}
            onPress={() => onAddCard(column.id)}
            accessibilityLabel="Adicionar cartão"
          >
            <Plus size={15} color={theme.colors.text2} strokeWidth={1.8} />
          </Pressable>
        </View>

        <View style={styles.cardsContent}>
          {column.cards.map((card) => (
            <BoardCard key={card.id} card={card} onPress={() => onOpenCard(card, column)} />
          ))}

          <Pressable
            style={({ pressed }) => [styles.addCard, pressed && styles.cardPressed]}
            onPress={() => onAddCard(column.id)}
            accessibilityRole="button"
          >
            <Plus size={14} color={theme.colors.text2} strokeWidth={1.8} />
            <Text style={styles.addCardText}>Adicionar cartão</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

function TaskListRow({ card, column, isDone, isPinned, onPress, onToggleDone, onTogglePinned }) {
  const label = findLabel(card.labelId)
  const members = findMembers(card.memberIds)
  const metaText = card.dueDate || card.schedule?.displayLabel || label?.text || column.title

  return (
    <View style={styles.taskListRow}>
      <Pressable
        style={[styles.taskCheck, isDone && styles.taskCheckDone]}
        onPress={() => onToggleDone?.(card, column, isDone)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone }}
        accessibilityLabel={`Marcar ${card.title} como ${isDone ? 'pendente' : 'concluida'}`}
      >
        {isDone ? <Check size={13} color={theme.colors.textInverse} strokeWidth={2.2} /> : null}
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.taskListRowContent, pressed && styles.cardPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Abrir tarefa ${card.title}`}
      >
        <View style={styles.taskListBody}>
          <Text
            style={[styles.taskListTitle, isDone && styles.taskListTitleDone]}
            numberOfLines={2}
          >
            {card.title}
          </Text>
          <View style={styles.taskListMetaRow}>
            <Clock3
              size={11}
              color={isDone ? theme.colors.red : theme.colors.text3}
              strokeWidth={1.9}
            />
            <Text
              style={[styles.taskListMeta, isDone && styles.taskListMetaDone]}
              numberOfLines={1}
            >
              {metaText}
            </Text>
            {members.length ? (
              <View style={styles.taskMiniMembers}>
                {members.slice(0, 2).map((member) => (
                  <MemberAvatar
                    key={member.id}
                    member={member}
                    style={styles.taskMiniAvatar}
                    textStyle={styles.taskMiniInitials}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      <Pressable
        style={styles.taskStarButton}
        onPress={() => onTogglePinned?.(card.id)}
        accessibilityRole="button"
        accessibilityState={{ selected: isPinned }}
        accessibilityLabel={isPinned ? `Remover estrela de ${card.title}` : `Marcar ${card.title} com estrela`}
      >
        <Star
          size={18}
          color={isPinned ? theme.colors.amber : theme.colors.text2}
          fill={isPinned ? theme.colors.amber : 'transparent'}
          strokeWidth={1.7}
        />
      </Pressable>
    </View>
  )
}

export default function MobileKanbanBoard({ route, navigation, plan: propPlan, columns: propColumns, onBack }) {
  styles = useThemedStyles(createStyles)
  const {
    plans,
    loadPlan,
    createColumn,
    createCard,
    updateCard: persistCard,
    deleteCard: persistDeleteCard,
    moveCard: persistMoveCard,
    addComment,
    createChecklist,
    createChecklistItem,
    updateChecklistItem,
    attachFileToCard,
    uploadAndAttachToCard,
    removeAttachment,
  } = usePlans()
  const { files, loadPlanFiles } = useFiles()
  const planId = route?.params?.planId ?? propPlan?.id
  const plan = plans.find((item) => item.id === planId) ?? propPlan
  const columns = plan?.boardColumns ?? propColumns ?? EMPTY_COLUMNS
  const [boardColumnsState, setBoardColumnsState] = useState(() => cloneBoardColumns(columns))
  const [activeColumnIndex, setActiveColumnIndex] = useState(0)
  const [targetColumnIndex, setTargetColumnIndex] = useState(null)
  const [dragPreviewColumnIndex, setDragPreviewColumnIndex] = useState(null)
  const [columnHeights, setColumnHeights] = useState({})
  const [selectedCardEntry, setSelectedCardEntry] = useState(null)
  const [boardView, setBoardView] = useState('lists')
  const [addCardSheet, setAddCardSheet] = useState(null)
  const [addListSheetOpen, setAddListSheetOpen] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newListTitle, setNewListTitle] = useState('')
  const [newCardColumnId, setNewCardColumnId] = useState(columns[0]?.id ?? null)
  const [tasksOptionsOpen, setTasksOptionsOpen] = useState(false)
  const [planFiles, setPlanFiles] = useState([])
  const verticalScrollRef = useRef(null)
  const columnTabsRef = useRef(null)
  const boardTranslateX = useRef(new Animated.Value(0)).current
  const previousPlanIdRef = useRef(null)
  const boardColumnsRef = useRef(boardColumnsState)
  const activeColumnIndexRef = useRef(activeColumnIndex)
  const selectedCardEntryRef = useRef(selectedCardEntry)
  const { width } = useWindowDimensions()
  const pageWidth = Math.min(width, 430)
  const motionViewportHeight = [activeColumnIndex, targetColumnIndex, dragPreviewColumnIndex]
    .reduce((maxHeight, index) => {
      if (!Number.isInteger(index)) return maxHeight
      const column = boardColumnsState[index]
      return column ? Math.max(maxHeight, columnHeights[column.id] ?? 0) : maxHeight
    }, 0)
  const totalCards = useMemo(
    () => boardColumnsState.reduce((sum, column) => sum + column.cards.length, 0),
    [boardColumnsState],
  )

  boardLabels = plan?.labelsMeta ?? []
  boardMembers = plan?.membersMeta ?? []

  useEffect(() => {
    boardColumnsRef.current = boardColumnsState
  }, [boardColumnsState])

  useEffect(() => {
    activeColumnIndexRef.current = activeColumnIndex
  }, [activeColumnIndex])

  useEffect(() => {
    selectedCardEntryRef.current = selectedCardEntry
  }, [selectedCardEntry])

  useEffect(() => {
    if (planId) {
      loadPlan(planId)
    }
  }, [loadPlan, planId])

  const taskGroups = useMemo(() => {
    const flatTasks = boardColumnsState.flatMap((column) => (
      column.cards.map((card) => ({
        card,
        column,
        isDone: isTaskDone(card, column),
        isPinned: Boolean(card.starred),
      }))
    ))

    return {
      active: flatTasks.filter((task) => !task.isDone),
      done: flatTasks.filter((task) => task.isDone),
    }
  }, [boardColumnsState])

  useEffect(() => {
    const previousPlanId = previousPlanIdRef.current
    const isSamePlan = previousPlanId === planId
    const previousColumns = boardColumnsRef.current
    const currentIndex = activeColumnIndexRef.current
    const selectedEntry = selectedCardEntryRef.current
    const nextColumns = cloneBoardColumns(columns)
    const fallbackIndex = Math.max(0, Math.min(currentIndex, nextColumns.length - 1))
    const preferredColumnId = selectedEntry?.column?.id ?? previousColumns[currentIndex]?.id
    const preferredIndex = preferredColumnId
      ? nextColumns.findIndex((column) => column.id === preferredColumnId)
      : -1
    const nextActiveIndex = preferredIndex >= 0 ? preferredIndex : fallbackIndex

    previousPlanIdRef.current = planId
    setBoardColumnsState(nextColumns)
    setTargetColumnIndex(null)
    setDragPreviewColumnIndex(null)

    if (!isSamePlan) {
      setActiveColumnIndex(0)
      setColumnHeights({})
      boardTranslateX.setValue(0)
      setSelectedCardEntry(null)
      setAddListSheetOpen(false)
      setNewListTitle('')
      setNewCardColumnId(nextColumns[0]?.id ?? null)
      return
    }

    setActiveColumnIndex(nextActiveIndex)
    boardTranslateX.setValue(-nextActiveIndex * pageWidth)
    setSelectedCardEntry((entry) => {
      if (!entry) return entry
      return findCardEntry(nextColumns, entry.card.id)
    })
    setNewCardColumnId((currentColumnId) => (
      nextColumns.some((column) => column.id === currentColumnId)
        ? currentColumnId
        : nextColumns[nextActiveIndex]?.id ?? nextColumns[0]?.id ?? null
    ))
  }, [boardTranslateX, columns, pageWidth, planId])

  useEffect(() => {
    let active = true
    if (!planId) {
      setPlanFiles([])
      return undefined
    }

    loadPlanFiles(planId)
      .then((items) => {
        if (active) setPlanFiles(items ?? [])
      })
      .catch(() => {
        if (active) setPlanFiles([])
      })

    return () => {
      active = false
    }
  }, [loadPlanFiles, planId])

  useEffect(() => {
    boardTranslateX.setValue(-activeColumnIndex * pageWidth)
  }, [activeColumnIndex, boardTranslateX, pageWidth])

  useEffect(() => {
    if (boardView !== 'lists') return

    requestAnimationFrame(() => {
      columnTabsRef.current?.scrollTo({
        x: Math.max(0, (activeColumnIndex * 111) - theme.spacing.screenX),
        animated: true,
      })
    })
  }, [activeColumnIndex, boardColumnsState.length, boardView])

  const scrollBoardToTop = () => {
    requestAnimationFrame(() => {
      verticalScrollRef.current?.scrollTo({ y: 0, animated: true })
    })
  }

  const handleColumnLayout = (columnId, event) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height)

    setColumnHeights((currentHeights) => {
      if (currentHeights[columnId] === nextHeight) {
        return currentHeights
      }

      return {
        ...currentHeights,
        [columnId]: nextHeight,
      }
    })
  }

  const animateToColumn = (index, options = {}) => {
    const safeIndex = Math.max(0, Math.min(index, boardColumnsState.length - 1))
    const shouldScrollTop = options.scrollTop ?? true
    setDragPreviewColumnIndex(null)

    if (safeIndex === activeColumnIndex) {
      setTargetColumnIndex(null)
      Animated.spring(boardTranslateX, {
        toValue: -activeColumnIndex * pageWidth,
        damping: 22,
        stiffness: 210,
        mass: 0.8,
        useNativeDriver: shouldUseNativeDriver,
      }).start()
      return
    }

    boardTranslateX.stopAnimation()
    setTargetColumnIndex(safeIndex)
    Animated.timing(boardTranslateX, {
      toValue: -safeIndex * pageWidth,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: shouldUseNativeDriver,
    }).start(({ finished }) => {
      if (finished) {
        setActiveColumnIndex(safeIndex)
        setTargetColumnIndex(null)
        boardTranslateX.setValue(-safeIndex * pageWidth)
        if (shouldScrollTop) {
          scrollBoardToTop()
        }
      }
    })
  }

  const goToColumn = (index) => {
    animateToColumn(index)
  }

  const cancelColumnDrag = () => {
    setTargetColumnIndex(null)
    setDragPreviewColumnIndex(null)
    Animated.spring(boardTranslateX, {
      toValue: -activeColumnIndex * pageWidth,
      damping: 22,
      stiffness: 210,
      mass: 0.8,
      useNativeDriver: shouldUseNativeDriver,
    }).start()
  }

  const boardSwipeResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => (
      boardView === 'lists'
        && Math.abs(gestureState.dx) > 8
        && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.1
    ),
    onMoveShouldSetPanResponderCapture: (_, gestureState) => (
      boardView === 'lists'
        && Math.abs(gestureState.dx) > 8
        && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.1
    ),
    onPanResponderGrant: () => {
      boardTranslateX.stopAnimation()
      setDragPreviewColumnIndex(null)
    },
    onPanResponderMove: (_, gestureState) => {
      const hasPrevious = activeColumnIndex > 0
      const hasNext = activeColumnIndex < boardColumnsState.length - 1
      let nextX = gestureState.dx
      const nextPreviewIndex = nextX < 0 && hasNext
        ? activeColumnIndex + 1
        : nextX > 0 && hasPrevious
          ? activeColumnIndex - 1
          : null

      if ((!hasPrevious && nextX > 0) || (!hasNext && nextX < 0)) {
        nextX *= 0.22
      }

      setDragPreviewColumnIndex((currentIndex) => (
        currentIndex === nextPreviewIndex ? currentIndex : nextPreviewIndex
      ))
      boardTranslateX.setValue((-activeColumnIndex * pageWidth) + nextX)
    },
    onPanResponderRelease: (_, gestureState) => {
      const shouldAdvance = gestureState.dx < -pageWidth * 0.22 || gestureState.vx < -0.55
      const shouldGoBack = gestureState.dx > pageWidth * 0.22 || gestureState.vx > 0.55

      if (shouldAdvance && activeColumnIndex < boardColumnsState.length - 1) {
        animateToColumn(activeColumnIndex + 1)
        return
      }

      if (shouldGoBack && activeColumnIndex > 0) {
        animateToColumn(activeColumnIndex - 1)
        return
      }

      cancelColumnDrag()
    },
    onPanResponderTerminate: cancelColumnDrag,
  }), [activeColumnIndex, boardColumnsState.length, boardTranslateX, boardView, pageWidth])

  if (!plan) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Carregando plano...</Text>
      </View>
    )
  }

  const changeBoardView = (nextView) => {
    if (nextView === boardView) {
      return
    }

    setBoardView(nextView)
    scrollBoardToTop()
  }

  const updateCard = (cardId, patch) => {
    const currentColumn = boardColumnsState.find((column) => column.cards.some((card) => card.id === cardId))
    const currentCard = currentColumn?.cards.find((card) => card.id === cardId)
    const nextCard = currentCard ? { ...currentCard, ...patch } : null

    setBoardColumnsState((currentColumns) => currentColumns.map((column) => ({
      ...column,
      cards: column.cards.map((card) => (
        card.id === cardId ? { ...card, ...patch } : card
      )),
    })))
    setSelectedCardEntry((entry) => (
      entry?.card.id === cardId
        ? { ...entry, card: { ...entry.card, ...patch } }
        : entry
    ))

    if (!planId || !nextCard) return

    if (patch.comments) {
      const previousIds = new Set((currentCard.comments ?? []).map((comment) => comment.id))
      const created = patch.comments.find((comment) => !previousIds.has(comment.id))
      if (created?.text) {
        void addComment(planId, cardId, created.text)
      }
      return
    }

    if (patch.checklists) {
      const previousChecklists = currentCard.checklists ?? []
      const previousChecklistIds = new Set(previousChecklists.map((checklist) => checklist.id))
      const createdChecklist = patch.checklists.find((checklist) => !previousChecklistIds.has(checklist.id))
      if (createdChecklist) {
        void (async () => {
          const checklist = await createChecklist(planId, cardId, createdChecklist.title ?? 'Checklist')
          const firstItem = (createdChecklist.items ?? []).find((item) => item.title || item.text)
          if (firstItem) {
            await createChecklistItem(planId, checklist?.id ?? createdChecklist.id, firstItem.title ?? firstItem.text)
          }
        })()
        return
      }

      const previousItems = new Map(previousChecklists.flatMap((checklist) => (
        (checklist.items ?? []).map((item) => [item.id, item])
      )))
      const changedItem = patch.checklists
        .flatMap((checklist) => (checklist.items ?? []).map((item) => ({ ...item, checklistId: checklist.id })))
        .find((item) => {
          const previous = previousItems.get(item.id)
          return !previous || Boolean(previous.checked ?? previous.completed) !== Boolean(item.checked ?? item.completed)
        })
      if (changedItem) {
        if (previousItems.has(changedItem.id)) {
          void updateChecklistItem(planId, {
            ...changedItem,
            title: changedItem.title ?? changedItem.text,
            completed: Boolean(changedItem.completed ?? changedItem.checked),
          })
        } else {
          void createChecklistItem(planId, changedItem.checklistId, changedItem.title ?? changedItem.text)
        }
      }
      return
    }

    void persistCard(planId, nextCard)
  }

  const deleteCard = (cardId) => {
    setBoardColumnsState((currentColumns) => currentColumns.map((column) => ({
      ...column,
      cards: column.cards.filter((card) => card.id !== cardId),
    })))
    setSelectedCardEntry((entry) => (entry?.card.id === cardId ? null : entry))
    if (planId) {
      void persistDeleteCard(planId, cardId)
    }
  }

  const duplicateCard = (cardId) => {
    setBoardColumnsState((currentColumns) => currentColumns.map((column) => {
      const sourceCard = column.cards.find((card) => card.id === cardId)
      if (!sourceCard) return column

      return {
        ...column,
        cards: [
          ...column.cards,
          {
            ...sourceCard,
            id: `mobile-card-copy-${Date.now()}`,
            title: `${sourceCard.title} (cópia)`,
            comments: [...(sourceCard.comments ?? [])],
            attachments: [...(sourceCard.attachments ?? [])],
            checklists: (sourceCard.checklists ?? []).map((checklist) => ({
              ...checklist,
              items: [...(checklist.items ?? [])],
            })),
          },
        ],
      }
    }))
  }

  const moveCard = (cardId, targetColumnId) => {
    let movingCard = null

    setBoardColumnsState((currentColumns) => {
      const withoutCard = currentColumns.map((column) => {
        const found = column.cards.find((card) => card.id === cardId)
        if (found) movingCard = found

        return {
          ...column,
          cards: column.cards.filter((card) => card.id !== cardId),
        }
      })

      if (!movingCard) return currentColumns

      return withoutCard.map((column) => (
        column.id === targetColumnId
          ? { ...column, cards: [...column.cards, movingCard] }
          : column
      ))
    })
    if (planId) {
      const targetColumn = boardColumnsState.find((column) => column.id === targetColumnId)
      void persistMoveCard(planId, cardId, targetColumnId, targetColumn?.cards.length ?? 0)
    }
  }

  const toggleTaskDone = (card, column, isDone) => {
    if (!card || !column) return
    updateCard(card.id, buildTaskCompletionPatch(card, column))
  }

  const toggleTaskPinned = (cardId) => {
    if (!cardId) return

    const currentCard = boardColumnsState.flatMap((column) => column.cards).find((card) => card.id === cardId)
    if (!currentCard) return
    updateCard(cardId, { starred: !currentCard.starred })
  }

  const attachCardFile = async (cardId, file) => {
    if (!planId || !file?.id) return
    await attachFileToCard(planId, file.id, cardId)
  }

  const uploadCardFile = async (cardId, asset) => {
    if (!planId || !asset) return
    await uploadAndAttachToCard(planId, {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType ?? 'application/octet-stream',
    }, cardId)
  }

  const removeCardAttachment = async (_cardId, attachment) => {
    if (!planId || !attachment?.id) return
    await removeAttachment(planId, attachment.id)
  }

  const openAddCardSheet = (columnId, allowColumnChoice = false) => {
    setNewCardTitle('')
    setNewCardColumnId(columnId ?? boardColumnsState[activeColumnIndex]?.id ?? boardColumnsState[0]?.id)
    setAddCardSheet({ allowColumnChoice })
  }

  const closeAddCardSheet = () => {
    setAddCardSheet(null)
  }

  const submitNewCard = () => {
    const title = newCardTitle.trim()
    if (!title || !newCardColumnId) return
    const newCard = { ...createLocalCard(title), columnId: newCardColumnId }

    setBoardColumnsState((currentColumns) => currentColumns.map((column) => (
      column.id === newCardColumnId
        ? { ...column, cards: [...column.cards, newCard] }
        : column
    )))
    setNewCardTitle('')
    closeAddCardSheet()
    if (planId) {
      void createCard(planId, newCard)
    }
  }

  const openAddListSheet = () => {
    setNewListTitle('')
    setAddListSheetOpen(true)
  }

  const closeAddListSheet = () => {
    setAddListSheetOpen(false)
    setNewListTitle('')
  }

  const submitNewList = () => {
    const title = newListTitle.trim()
    if (!title) return
    const newIndex = boardColumnsState.length
    const newColumn = createLocalColumn(title, newIndex)

    setBoardColumnsState((currentColumns) => [...currentColumns, newColumn])
    setColumnHeights((currentHeights) => ({
      ...currentHeights,
      [newColumn.id]: 0,
    }))
    setActiveColumnIndex(newIndex)
    setTargetColumnIndex(null)
    setDragPreviewColumnIndex(null)
    boardTranslateX.setValue(-newIndex * pageWidth)
    scrollBoardToTop()
    closeAddListSheet()
    if (planId) {
      void createColumn(planId, { title, color: newColumn.color })
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.cardPressed]}
          onPress={onBack ?? (() => navigation?.goBack())}
          accessibilityLabel="Voltar para Home"
          hitSlop={8}
        >
          <ArrowLeft size={18} color={theme.colors.text1} strokeWidth={1.8} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{plan.name}</Text>
        <View style={styles.headerMeta}>
          <Users size={14} color={theme.colors.text3} strokeWidth={1.8} />
          <Text style={styles.headerMetaText}>{boardMembers.length}</Text>
          <Text style={styles.headerMetaDot}>·</Text>
          <Text style={styles.headerMetaText}>{totalCards} cartões</Text>
        </View>
      </View>

      {boardView === 'lists' ? (
        <View style={styles.columnTabsBar}>
          <ScrollView
            ref={columnTabsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.columnTabs}
            contentContainerStyle={styles.columnTabsContent}
          >
            {boardColumnsState.map((column, index) => {
              const isActive = index === activeColumnIndex

              return (
                <Pressable
                  key={column.id}
                  style={[styles.columnTab, isActive && styles.columnTabActive]}
                  onPress={() => goToColumn(index)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={[styles.columnTabDot, { backgroundColor: column.color }]} />
                  <Text style={[styles.columnTabText, isActive && styles.columnTabTextActive]} numberOfLines={1}>
                    {column.title}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.addListButton, pressed && styles.cardPressed]}
            onPress={openAddListSheet}
            accessibilityRole="button"
            accessibilityLabel="Adicionar lista"
          >
            <Plus size={16} color={theme.colors.textInverse} strokeWidth={2} />
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        ref={verticalScrollRef}
        style={styles.boardScroll}
        contentContainerStyle={[
          styles.boardScrollContent,
          boardView === 'tasks' && styles.tasksScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {boardView === 'lists' ? (
          <View style={styles.boardSwipeArea} {...boardSwipeResponder.panHandlers}>
            <View style={[styles.columnMotionViewport, motionViewportHeight ? { height: motionViewportHeight } : null, { width: pageWidth }]}>
              <Animated.View style={[styles.columnMotionTrack, { transform: [{ translateX: boardTranslateX }] }]}>
                {boardColumnsState.map((column, index) => (
                  <BoardColumn
                    key={column.id}
                    column={column}
                    width={pageWidth}
                    onAddCard={(columnId) => openAddCardSheet(columnId, false)}
                    onLayout={(event) => handleColumnLayout(column.id, event)}
                    onOpenCard={(card, cardColumn) => setSelectedCardEntry({ card, column: cardColumn })}
                    aria-hidden={index !== activeColumnIndex}
                    accessibilityElementsHidden={index !== activeColumnIndex}
                    importantForAccessibility={index === activeColumnIndex ? 'auto' : 'no-hide-descendants'}
                  />
                ))}
              </Animated.View>
            </View>
          </View>
        ) : (
          <View style={styles.tasksView}>
            <View style={styles.tasksHeader}>
              <View style={styles.tasksHeaderText}>
                <Text style={styles.eyebrow}>Visão</Text>
                <Text style={styles.tasksTitle}>Tarefas</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.tasksMoreButton, pressed && styles.cardPressed]}
                onPress={() => setTasksOptionsOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Mais opções"
              >
                <MoreHorizontal size={18} color={theme.colors.text2} strokeWidth={1.8} />
              </Pressable>
            </View>

            <View style={styles.taskListGroup}>
              {taskGroups.active.map(({ card, column, isDone, isPinned }) => (
                <TaskListRow
                  key={card.id}
                  card={card}
                  column={column}
                  isDone={isDone}
                  isPinned={isPinned}
                  onPress={() => setSelectedCardEntry({ card, column })}
                  onToggleDone={toggleTaskDone}
                  onTogglePinned={toggleTaskPinned}
                />
              ))}
            </View>

            {taskGroups.done.length ? (
              <View style={styles.completedTasksBlock}>
                <View style={styles.completedHeader}>
                  <ChevronDown size={15} color={theme.colors.text2} strokeWidth={2} />
                  <Text style={styles.completedTitle}>Concluída</Text>
                  <Text style={styles.completedCount}>{taskGroups.done.length}</Text>
                </View>

                <View style={styles.taskListGroup}>
                  {taskGroups.done.map(({ card, column, isDone, isPinned }) => (
                    <TaskListRow
                      key={card.id}
                      card={card}
                      column={column}
                      isDone={isDone}
                      isPinned={isPinned}
                      onPress={() => setSelectedCardEntry({ card, column })}
                      onToggleDone={toggleTaskDone}
                      onTogglePinned={toggleTaskPinned}
                    />
                  ))}
                </View>
              </View>
            ) : null}

          </View>
        )}
      </ScrollView>

      {boardView === 'tasks' ? (
        <View {...withPlatformPointerEvents(styles.tasksFabOverlay, 'box-none')}>
          <Pressable
            style={[styles.tasksFab, interactivePointerEventsStyle]}
            onPress={() => openAddCardSheet(boardColumnsState[0]?.id, true)}
            accessibilityRole="button"
            accessibilityLabel="Adicionar tarefa"
          >
            <Plus size={18} color={theme.colors.textInverse} strokeWidth={2} />
          </Pressable>
        </View>
      ) : null}

      <View {...withPlatformPointerEvents(styles.viewToolbarOverlay, 'box-none')}>
        <View style={[styles.viewToolbar, interactivePointerEventsStyle]}>
          {[
            { id: 'lists', label: 'Listas', icon: Kanban },
            { id: 'tasks', label: 'Tarefas', icon: ListChecks },
          ].map((item) => {
            const isActive = boardView === item.id
            const Icon = item.icon

            return (
              <Pressable
                key={item.id}
                style={[styles.viewButton, isActive && styles.viewButtonActive]}
                onPress={() => changeBoardView(item.id)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: isActive }}
              >
                <Icon
                  size={17}
                  color={isActive ? theme.colors.text1 : theme.colors.text3}
                  strokeWidth={1.8}
                />
              </Pressable>
            )
          })}
        </View>
      </View>

      {selectedCardEntry ? (
        <CardDetailScreen
          card={selectedCardEntry.card}
          column={selectedCardEntry.column}
          columns={boardColumnsState}
          files={files}
          planFiles={planFiles}
          onAttachFile={attachCardFile}
          onClose={() => setSelectedCardEntry(null)}
          onDeleteCard={deleteCard}
          onDuplicateCard={duplicateCard}
          onMoveCard={moveCard}
          onRemoveAttachment={removeCardAttachment}
          onUpdateCard={updateCard}
          onUploadFile={uploadCardFile}
        />
      ) : null}

      <BottomSheet visible={Boolean(addCardSheet)} onClose={closeAddCardSheet} title={addCardSheet?.allowColumnChoice ? 'Adicionar tarefa' : 'Adicionar cartão'}>
        <TextInput
          value={newCardTitle}
          onChangeText={setNewCardTitle}
          placeholder="Título do cartão"
          placeholderTextColor={theme.colors.text3}
          style={styles.sheetInput}
          selectionColor={theme.colors.text1}
          autoCorrect={false}
        />
        {addCardSheet?.allowColumnChoice ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addCardColumnChoices}>
            {boardColumnsState.map((column) => {
              const isSelected = newCardColumnId === column.id
              return (
                <Pressable
                  key={column.id}
                  style={[styles.addCardColumnChoice, isSelected && styles.addCardColumnChoiceActive]}
                  onPress={() => setNewCardColumnId(column.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[styles.sheetColorDot, { backgroundColor: column.color }]} />
                  <Text style={[styles.addCardColumnChoiceText, isSelected && styles.addCardColumnChoiceTextActive]} numberOfLines={1}>
                    {column.title}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        ) : null}
        <Pressable
          style={[styles.sheetPrimaryButton, !newCardTitle.trim() && styles.sheetPrimaryButtonDisabled]}
          onPress={submitNewCard}
          disabled={!newCardTitle.trim()}
          accessibilityRole="button"
          accessibilityState={{ disabled: !newCardTitle.trim() }}
        >
          <Text style={[styles.sheetPrimaryButtonText, !newCardTitle.trim() && styles.sheetPrimaryButtonTextDisabled]}>
            Criar
          </Text>
        </Pressable>
      </BottomSheet>

      <BottomSheet visible={addListSheetOpen} onClose={closeAddListSheet} title="Adicionar lista">
        <TextInput
          value={newListTitle}
          onChangeText={setNewListTitle}
          placeholder="Nome da lista..."
          placeholderTextColor={theme.colors.text3}
          style={styles.sheetInput}
          selectionColor={theme.colors.text1}
          autoCorrect={false}
          accessibilityLabel="Nome da lista"
        />
        <Pressable
          style={[styles.sheetPrimaryButton, !newListTitle.trim() && styles.sheetPrimaryButtonDisabled]}
          onPress={submitNewList}
          disabled={!newListTitle.trim()}
          accessibilityRole="button"
          accessibilityState={{ disabled: !newListTitle.trim() }}
        >
          <Text style={[styles.sheetPrimaryButtonText, !newListTitle.trim() && styles.sheetPrimaryButtonTextDisabled]}>
            Adicionar lista
          </Text>
        </Pressable>
      </BottomSheet>

      <BottomSheet visible={tasksOptionsOpen} onClose={() => setTasksOptionsOpen(false)} title="Tarefas">
        <View style={styles.sheetActionList}>
          <Pressable style={styles.sheetActionRow} onPress={() => setTasksOptionsOpen(false)} accessibilityRole="button">
            <Clock3 size={18} color={theme.colors.text1} strokeWidth={1.8} />
            <Text style={styles.sheetActionText}>Ordenar por prazo</Text>
          </Pressable>
          <Pressable style={styles.sheetActionRow} onPress={() => setTasksOptionsOpen(false)} accessibilityRole="button">
            <CheckSquare size={18} color={theme.colors.text1} strokeWidth={1.8} />
            <Text style={styles.sheetActionText}>Mostrar concluídas</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -2,
    padding: 2,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
  },
  headerMetaText: {
    color: theme.colors.text3,
    fontSize: 13,
  },
  headerMetaDot: {
    color: theme.colors.text3,
    fontSize: 13,
  },
  eyebrow: {
    color: theme.colors.text3,
    ...theme.type.eyebrow,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: theme.colors.text1,
    ...theme.type.display,
  },
  viewToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
  },
  viewToolbarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    alignItems: 'center',
  },
  viewButton: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  viewButtonActive: {
    backgroundColor: theme.colors.surface1,
  },
  columnTabsBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: theme.spacing.screenX,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  columnTabs: {
    flex: 1,
    height: 52,
  },
  columnTabsContent: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.screenX,
  },
  columnTab: {
    maxWidth: 120,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  columnTabActive: {
    backgroundColor: theme.colors.surface1,
    borderColor: theme.colors.border2,
  },
  columnTabDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  columnTabText: {
    flexShrink: 1,
    color: theme.colors.text3,
    fontSize: 13,
    fontWeight: '500',
  },
  columnTabTextActive: {
    color: theme.colors.text1,
  },
  addListButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.text1,
  },
  boardScroll: {
    flex: 1,
  },
  boardScrollContent: {
    paddingBottom: 100,
  },
  tasksScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  boardSwipeArea: {
    alignItems: 'center',
  },
  columnMotionViewport: {
    overflow: 'hidden',
  },
  columnMotionTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  columnPage: {
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 14,
    paddingBottom: 20,
  },
  column: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 12,
    backgroundColor: theme.colors.surface2,
  },
  columnHeader: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
  },
  columnTitleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  columnDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  columnTitle: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '600',
  },
  columnCount: {
    minWidth: 23,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: theme.colors.surface3,
    color: theme.colors.text2,
    fontSize: 12,
    textAlign: 'center',
  },
  columnAction: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
  },
  cardsContent: {
    gap: 10,
    padding: 10,
    paddingBottom: 18,
  },
  card: {
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 10,
    backgroundColor: theme.colors.surface1,
  },
  cardPressed: {
    opacity: 0.84,
  },
  cardLabel: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cardLabelText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  cardTitle: {
    color: theme.colors.text1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  cardDescription: {
    color: theme.colors.text2,
    fontSize: 12,
    lineHeight: 17,
  },
  cardFooter: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaPill: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: theme.colors.surface3,
  },
  metaText: {
    color: theme.colors.text2,
    fontSize: 11,
  },
  memberStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    borderWidth: 2,
    borderColor: theme.colors.surface1,
    borderRadius: 999,
  },
  memberInitials: {
    color: theme.colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  addCard: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border2,
    borderRadius: 10,
  },
  addCardText: {
    color: theme.colors.text2,
    fontSize: 13,
  },
  tasksView: {
    minHeight: '100%',
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 18,
    paddingBottom: 116,
  },
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tasksHeaderText: {
    gap: 4,
  },
  tasksTitle: {
    color: theme.colors.text1,
    ...theme.type.display,
  },
  tasksMoreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  taskListGroup: {
    gap: 0,
  },
  taskListRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  taskListRowContent: {
    flex: 1,
    minWidth: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  taskCheck: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border2,
    borderRadius: theme.radius.sm,
  },
  taskCheckDone: {
    borderColor: theme.colors.text1,
    backgroundColor: theme.colors.text1,
  },
  taskListBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  taskListTitle: {
    color: theme.colors.text1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  taskListTitleDone: {
    color: theme.colors.text3,
    textDecorationLine: 'line-through',
  },
  taskListMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  taskListMeta: {
    flexShrink: 1,
    color: theme.colors.text3,
    fontSize: 12,
  },
  taskListMetaDone: {
    color: theme.colors.text3,
  },
  taskMiniMembers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
  },
  taskMiniAvatar: {
    width: 16,
    height: 16,
    marginLeft: -3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    borderRadius: 999,
  },
  taskMiniInitials: {
    color: theme.colors.textInverse,
    fontSize: 6,
    fontWeight: '700',
  },
  taskStarButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTasksBlock: {
    marginTop: 28,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  completedTitle: {
    color: theme.colors.text3,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  completedCount: {
    color: theme.colors.text3,
    fontSize: 12,
  },
  tasksFab: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.text1,
  },
  tasksFabOverlay: {
    position: 'absolute',
    right: theme.spacing.screenX,
    bottom: 80,
  },
  detailScreen: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  detailTopbar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: theme.spacing.screenX,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  detailIconButton: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  detailTopbarTitle: {
    flex: 1,
    color: theme.colors.text2,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 22,
    paddingBottom: 40,
  },
  detailHero: {
    gap: 8,
    marginBottom: 22,
  },
  detailEyebrow: {
    color: theme.colors.text3,
    ...theme.type.eyebrow,
    textTransform: 'uppercase',
  },
  detailTitle: {
    color: theme.colors.text1,
    ...theme.type.display,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 2,
  },
  detailLabelDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  detailLabelText: {
    color: theme.colors.text2,
    fontSize: 13,
    fontWeight: '500',
  },
  detailMetaGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  detailMetaItem: {
    flex: 1,
    gap: 8,
  },
  detailMetaLabel: {
    color: theme.colors.text3,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  detailMetaEmpty: {
    color: theme.colors.text3,
    fontSize: 14,
  },
  detailMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailMemberAvatar: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    borderRadius: 999,
  },
  detailMemberInitials: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  detailDueText: {
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '500',
  },
  detailActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  detailAction: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  detailActionText: {
    color: theme.colors.text1,
    fontSize: 12.5,
    fontWeight: '500',
  },
  detailSection: {
    marginBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border1,
    paddingTop: 20,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  detailSectionTitleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailSectionTitle: {
    flexShrink: 1,
    color: theme.colors.text1,
    ...theme.type.heading,
  },
  detailSectionAction: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface2,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  detailSectionActionDisabled: {
    opacity: 0.45,
  },
  detailSectionActionText: {
    color: theme.colors.text1,
    fontSize: 12,
    fontWeight: '600',
  },
  detailSectionActionTextDisabled: {
    color: theme.colors.text3,
  },
  detailDescriptionInput: {
    minHeight: 110,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
    color: theme.colors.text1,
    fontSize: 14,
    lineHeight: 20,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  detailEmptyText: {
    color: theme.colors.text3,
    fontSize: 13,
    lineHeight: 19,
  },
  detailInfoRow: {
    paddingVertical: 4,
  },
  detailInfoText: {
    color: theme.colors.text2,
    fontSize: 13,
  },
  detailSecondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  detailSecondaryAction: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  detailSecondaryActionText: {
    color: theme.colors.text2,
    fontSize: 12,
    fontWeight: '500',
  },
  detailComposer: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 5,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
  },
  detailCommentInput: {
    flex: 1,
    minHeight: 36,
    color: theme.colors.text1,
    fontSize: 14,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  detailSendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.text1,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  detailSendButtonDisabled: {
    backgroundColor: theme.colors.surface3,
  },
  detailActivityList: {
    gap: 16,
    marginTop: 18,
  },
  detailActivityItem: {
    flexDirection: 'row',
    gap: 12,
  },
  detailActivityAvatar: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
  },
  detailActivityInitials: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  detailActivityBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  detailActivityText: {
    color: theme.colors.text2,
    fontSize: 13.5,
    lineHeight: 19,
  },
  detailActivityAuthor: {
    color: theme.colors.text1,
    fontWeight: '600',
  },
  detailActivityTime: {
    color: theme.colors.text3,
    fontSize: 11.5,
  },
  detailAttachmentList: {
    gap: 0,
    marginTop: 8,
  },
  detailAttachmentItem: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  detailAttachmentRemove: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAttachmentName: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 13.5,
    fontWeight: '500',
  },
  detailAttachmentTime: {
    color: theme.colors.text3,
    fontSize: 12,
  },
  detailInlineError: {
    color: theme.colors.red,
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 8,
  },
  detailChecklistList: {
    gap: 0,
    marginTop: 8,
  },
  detailChecklistItem: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  detailChecklistCheck: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border2,
    borderRadius: theme.radius.sm,
  },
  detailChecklistCheckDone: {
    borderColor: theme.colors.text1,
    backgroundColor: theme.colors.text1,
  },
  detailChecklistText: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 14,
  },
  detailChecklistTextDone: {
    color: theme.colors.text3,
    textDecorationLine: 'line-through',
  },
  sheetActionList: {
    gap: 0,
  },
  sheetActionRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  sheetActionText: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '500',
  },
  sheetActionDanger: {
    borderBottomWidth: 0,
  },
  sheetActionDangerText: {
    color: theme.colors.red,
  },
  sheetColorDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  scheduleEditor: {
    gap: 14,
  },
  scheduleToggleList: {
    gap: 0,
  },
  scheduleToggleRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  scheduleCheckbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border2,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface1,
  },
  scheduleCheckboxChecked: {
    borderColor: theme.colors.text1,
    backgroundColor: theme.colors.text1,
  },
  scheduleToggleText: {
    flex: 1,
    minWidth: 0,
  },
  scheduleToggleLabel: {
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleToggleHint: {
    color: theme.colors.text3,
    fontSize: 12,
    marginTop: 2,
  },
  calendarHeader: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  calendarTitle: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
  },
  calendarNavText: {
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarWeekday: {
    width: '13.2%',
    marginBottom: 2,
    color: theme.colors.text3,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  calendarDay: {
    width: '13.2%',
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  calendarDayMuted: {
    opacity: 0.4,
  },
  calendarDaySelected: {
    backgroundColor: theme.colors.text1,
  },
  calendarDayText: {
    color: theme.colors.text1,
    fontSize: 13,
    fontWeight: '500',
  },
  calendarDayTextMuted: {
    color: theme.colors.text3,
  },
  calendarDayTextSelected: {
    color: theme.colors.textInverse,
  },
  sheetChipList: {
    gap: 0,
  },
  sheetMemberRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  sheetMemberRowActive: {
    opacity: 1,
  },
  sheetLabelOption: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    marginBottom: 8,
  },
  sheetLabelText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  sheetInput: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
    color: theme.colors.text1,
    fontSize: 15,
    marginBottom: 12,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  attachmentPickerScroll: {
    maxHeight: 420,
  },
  attachmentPickerContent: {
    gap: 0,
    paddingBottom: 6,
  },
  attachmentPickerSectionTitle: {
    color: theme.colors.text3,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 4,
  },
  attachmentPickerRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border1,
  },
  attachmentPickerBody: {
    flex: 1,
    minWidth: 0,
  },
  attachmentPickerName: {
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '500',
  },
  attachmentPickerMeta: {
    color: theme.colors.text3,
    fontSize: 12,
    marginTop: 2,
  },
  sheetButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetPrimaryButton: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.text1,
  },
  sheetPrimaryButtonDisabled: {
    backgroundColor: theme.colors.surface3,
  },
  sheetPrimaryButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  sheetPrimaryButtonTextDisabled: {
    color: theme.colors.text3,
  },
  sheetSecondaryButton: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface2,
  },
  sheetSecondaryButtonText: {
    color: theme.colors.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  addCardColumnChoices: {
    gap: 8,
    paddingBottom: 10,
  },
  addCardColumnChoice: {
    maxWidth: 128,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border1,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface2,
  },
  addCardColumnChoiceActive: {
    borderColor: theme.colors.text1,
    backgroundColor: theme.colors.surface1,
  },
  addCardColumnChoiceText: {
    flexShrink: 1,
    color: theme.colors.text3,
    fontSize: 12,
    fontWeight: '500',
  },
  addCardColumnChoiceTextActive: {
    color: theme.colors.text1,
  },
})

let styles = createStyles(theme)
