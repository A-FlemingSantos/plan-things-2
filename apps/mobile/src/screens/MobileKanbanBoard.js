import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import {
  AlignLeft,
  ArrowLeft,
  CheckSquare,
  Clock3,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Send,
  Tag,
  Users,
  X,
} from 'lucide-react-native'
import { boardLabels, boardMembers } from '../data/demoData'
import { theme } from '../theme/tokens'

function findLabel(labelId) {
  return boardLabels.find((label) => label.id === labelId) ?? null
}

function findMembers(memberIds = []) {
  return memberIds
    .map((memberId) => boardMembers.find((member) => member.id === memberId))
    .filter(Boolean)
}

function BoardCard({ card, onPress }) {
  const label = findLabel(card.labelId)
  const members = findMembers(card.memberIds)
  const hasMeta = Boolean(card.dueDate || card.comments?.length || members.length)

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
            {card.dueDate ? (
              <View style={styles.metaPill}>
                <Clock3 size={12} color={theme.colors.text2} strokeWidth={1.8} />
                <Text style={styles.metaText}>{card.dueDate}</Text>
              </View>
            ) : null}
            {card.comments?.length ? (
              <View style={styles.metaPill}>
                <MessageCircle size={12} color={theme.colors.text2} strokeWidth={1.8} />
                <Text style={styles.metaText}>{card.comments.length}</Text>
              </View>
            ) : null}
          </View>

          {members.length ? (
            <View style={styles.memberStack}>
              {members.slice(0, 3).map((member) => (
                <View key={member.id} style={[styles.memberAvatar, { backgroundColor: member.color }]}>
                  <Text style={styles.memberInitials}>{member.initials}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  )
}

function DetailAction({ icon: Icon, label }) {
  return (
    <Pressable style={styles.detailAction} accessibilityRole="button">
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
      <Icon size={14} color={disabled ? theme.colors.text3 : theme.colors.white} strokeWidth={1.9} />
      <Text style={[styles.detailSectionActionText, disabled && styles.detailSectionActionTextDisabled]}>{label}</Text>
    </Pressable>
  )
}

function DetailSecondaryAction({ icon: Icon = Plus, label }) {
  return (
    <Pressable style={styles.detailSecondaryAction} accessibilityRole="button">
      <Icon size={14} color={theme.colors.text1} strokeWidth={1.8} />
      <Text style={styles.detailSecondaryActionText}>{label}</Text>
    </Pressable>
  )
}

function CardDetailScreen({ card, column, onClose }) {
  const [savedDescription, setSavedDescription] = useState(card.description ?? '')
  const [descriptionValue, setDescriptionValue] = useState(savedDescription)
  const slideProgress = useRef(new Animated.Value(1)).current
  const { height } = useWindowDimensions()
  const label = findLabel(card.labelId)
  const members = findMembers(card.memberIds)
  const comments = Array.isArray(card.comments) ? card.comments : []
  const attachments = Array.isArray(card.attachments) ? card.attachments : []
  const checklists = Array.isArray(card.checklists) ? card.checklists : []
  const hasDescriptionChanges = descriptionValue !== savedDescription
  const translateY = slideProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  })

  useEffect(() => {
    Animated.timing(slideProgress, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [slideProgress])

  const close = () => {
    Animated.timing(slideProgress, {
      toValue: 1,
      duration: 210,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose()
      }
    })
  }

  const concludeDescriptionEdit = () => {
    setSavedDescription(descriptionValue)
    Keyboard.dismiss()
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <Animated.View style={[styles.detailScreen, { transform: [{ translateY }] }]}>
        <View style={styles.detailTopbar}>
          <Pressable
            style={styles.detailIconButton}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Fechar cartão"
          >
            <X size={20} color={theme.colors.text1} strokeWidth={1.9} />
          </Pressable>
          <Text style={styles.detailTopbarTitle} numberOfLines={1}>Cartão</Text>
          <Pressable
            style={styles.detailIconButton}
            accessibilityRole="button"
            accessibilityLabel="Mais opções"
          >
            <MoreHorizontal size={19} color={theme.colors.text1} strokeWidth={1.8} />
          </Pressable>
        </View>

        <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailHero}>
            {label ? (
              <View style={[styles.detailLabel, { backgroundColor: label.color }]}>
                <Text style={styles.detailLabelText}>{label.text}</Text>
              </View>
            ) : null}

            <Text style={styles.detailTitle}>{card.title}</Text>
            <Text style={styles.detailListName}>em {column.title}</Text>
          </View>

          <View style={styles.detailMetaGrid}>
            <View style={styles.detailMetaItem}>
              <Text style={styles.detailMetaLabel}>Membros</Text>
              {members.length ? (
                <View style={styles.detailMemberRow}>
                  {members.map((member) => (
                    <View key={member.id} style={[styles.detailMemberAvatar, { backgroundColor: member.color }]}>
                      <Text style={styles.detailMemberInitials}>{member.initials}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.detailMetaEmpty}>Sem membros</Text>
              )}
            </View>

            <View style={styles.detailMetaItem}>
              <Text style={styles.detailMetaLabel}>Data</Text>
              <View style={styles.detailDuePill}>
                <Clock3 size={13} color={theme.colors.text2} strokeWidth={1.8} />
                <Text style={styles.detailDueText}>{card.dueDate || 'Sem data'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailActionGrid}>
            <DetailAction icon={Users} label="Membros" />
            <DetailAction icon={Tag} label="Etiquetas" />
            <DetailAction icon={Clock3} label="Data" />
            <DetailAction icon={CheckSquare} label="Checklist" />
            <DetailAction icon={Paperclip} label="Anexo" />
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <View style={styles.detailSectionTitleWrap}>
                <AlignLeft size={17} color={theme.colors.text1} strokeWidth={1.8} />
                <Text style={styles.detailSectionTitle}>Descrição</Text>
              </View>
              <DetailSectionAction
                disabled={!hasDescriptionChanges}
                icon={CheckSquare}
                label="Concluir"
                onPress={concludeDescriptionEdit}
              />
            </View>
            <TextInput
              style={styles.detailDescriptionInput}
              value={descriptionValue}
              onChangeText={setDescriptionValue}
              multiline
              textAlignVertical="top"
              placeholder="Adicionar uma descrição para orientar o trabalho deste cartão."
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
              <DetailSectionAction icon={Paperclip} label="Adicionar" />
            </View>
            <View style={styles.detailInfoRow}>
              <Text style={styles.detailInfoText}>
                {attachments.length ? `${attachments.length} arquivo(s) anexado(s)` : 'Nenhum arquivo anexado a este cartão.'}
              </Text>
            </View>
            <View style={styles.detailSecondaryActions}>
              <DetailSecondaryAction icon={Paperclip} label="Biblioteca" />
              <DetailSecondaryAction icon={Plus} label="Meu dispositivo" />
            </View>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <View style={styles.detailSectionTitleWrap}>
                <CheckSquare size={17} color={theme.colors.text1} strokeWidth={1.8} />
                <Text style={styles.detailSectionTitle}>Checklist</Text>
              </View>
              <DetailSectionAction icon={CheckSquare} label="Adicionar" />
            </View>
            <View style={styles.detailInfoRow}>
              <Text style={styles.detailInfoText}>
                {checklists.length ? `${checklists.length} checklist(s) neste cartão` : 'Nenhum checklist criado ainda.'}
              </Text>
            </View>
            <View style={styles.detailSecondaryActions}>
              <DetailSecondaryAction icon={CheckSquare} label="Criar checklist" />
              <DetailSecondaryAction icon={Plus} label="Adicionar item" />
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
                placeholder="Escrever comentário..."
                placeholderTextColor={theme.colors.text3}
              />
              <Pressable
                style={styles.detailSendButton}
                accessibilityRole="button"
                accessibilityLabel="Enviar comentário"
              >
                <Send size={15} color={theme.colors.white} strokeWidth={1.9} />
              </Pressable>
            </View>

            <View style={styles.detailActivityList}>
              {comments.length ? (
                comments.map((comment) => {
                  const author = boardMembers.find((member) => member.id === comment.author)

                  return (
                    <View key={comment.id} style={styles.detailActivityItem}>
                      <View style={[styles.detailActivityAvatar, { backgroundColor: author?.color ?? theme.colors.black }]}>
                        <Text style={styles.detailActivityInitials}>{author?.initials ?? 'PT'}</Text>
                      </View>
                      <View style={styles.detailActivityBody}>
                        <Text style={styles.detailActivityText}>
                          <Text style={styles.detailActivityAuthor}>{author?.initials ?? 'Membro'} </Text>
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
      </Animated.View>
    </Modal>
  )
}

function BoardColumn({ column, width, onLayout, onOpenCard }) {
  return (
    <View style={[styles.columnPage, { width }]} onLayout={onLayout}>
      <View style={styles.column}>
        <View style={styles.columnHeader}>
          <View style={styles.columnTitleWrap}>
            <View style={[styles.columnDot, { backgroundColor: column.color }]} />
            <Text style={styles.columnTitle}>{column.title}</Text>
            <Text style={styles.columnCount}>{column.cards.length}</Text>
          </View>
          <Pressable style={styles.columnAction} accessibilityLabel="Adicionar cartão">
            <Plus size={15} color={theme.colors.text2} strokeWidth={1.8} />
          </Pressable>
        </View>

        <View style={styles.cardsContent}>
          {column.cards.map((card) => (
            <BoardCard key={card.id} card={card} onPress={() => onOpenCard(card, column)} />
          ))}

          <Pressable style={styles.addCard}>
            <Plus size={14} color={theme.colors.text2} strokeWidth={1.8} />
            <Text style={styles.addCardText}>Adicionar cartão</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

export default function MobileKanbanBoard({ plan, columns, onBack }) {
  const [activeColumnIndex, setActiveColumnIndex] = useState(0)
  const [columnHeights, setColumnHeights] = useState({})
  const [selectedCardEntry, setSelectedCardEntry] = useState(null)
  const verticalScrollRef = useRef(null)
  const scrollRef = useRef(null)
  const { width } = useWindowDimensions()
  const pageWidth = Math.min(width, 430)
  const activeColumnHeight = columnHeights[columns[activeColumnIndex]?.id]
  const totalCards = useMemo(
    () => columns.reduce((sum, column) => sum + column.cards.length, 0),
    [columns],
  )

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

  const handleMomentumEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const nextIndex = Math.round(offsetX / pageWidth)

    if (nextIndex === activeColumnIndex) {
      return
    }

    setActiveColumnIndex(nextIndex)
    scrollBoardToTop()
  }

  const goToColumn = (index) => {
    if (index === activeColumnIndex) {
      return
    }

    setActiveColumnIndex(index)
    scrollBoardToTop()
    scrollRef.current?.scrollTo({ x: index * pageWidth, animated: true })
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton} onPress={onBack} accessibilityLabel="Voltar para Home">
            <ArrowLeft size={19} color={theme.colors.text1} strokeWidth={1.9} />
          </Pressable>
          <View style={styles.headerMetaPill}>
            <Users size={13} color={theme.colors.text2} strokeWidth={1.8} />
            <Text style={styles.headerMetaText}>{boardMembers.length}</Text>
          </View>
        </View>

        <Text style={styles.breadcrumb}>Início / Quadro</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{plan.name}</Text>
          <Text style={styles.totalCount}>{totalCards}</Text>
        </View>
        <Text style={styles.subtitle}>
          Arraste para o lado para navegar pelas listas.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.columnTabs}
        contentContainerStyle={styles.columnTabsContent}
      >
        {columns.map((column, index) => {
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

      <ScrollView
        ref={verticalScrollRef}
        style={styles.boardScroll}
        contentContainerStyle={styles.boardScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumEnd}
          style={[styles.boardPager, activeColumnHeight ? { height: activeColumnHeight } : null]}
        >
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              width={pageWidth}
              onLayout={(event) => handleColumnLayout(column.id, event)}
              onOpenCard={(card, cardColumn) => setSelectedCardEntry({ card, column: cardColumn })}
            />
          ))}
        </ScrollView>
      </ScrollView>

      <View pointerEvents="box-none" style={styles.pageDots}>
        {columns.map((column, index) => (
          <Pressable
            key={`dot-${column.id}`}
            style={[
              styles.pageDot,
              index === activeColumnIndex && styles.pageDotActive,
            ]}
            onPress={() => goToColumn(index)}
            accessibilityLabel={`Ir para ${column.title}`}
          />
        ))}
      </View>

      {selectedCardEntry ? (
        <CardDetailScreen
          card={selectedCardEntry.card}
          column={selectedCardEntry.column}
          onClose={() => setSelectedCardEntry(null)}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  header: {
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
  },
  headerTop: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
  },
  headerMetaPill: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 999,
    backgroundColor: theme.colors.surface2,
  },
  headerMetaText: {
    color: theme.colors.text2,
    fontSize: 12,
  },
  breadcrumb: {
    color: theme.colors.text3,
    fontSize: 12,
    marginBottom: 7,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text1,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '400',
  },
  totalCount: {
    minWidth: 29,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.surface3,
    color: theme.colors.text2,
    fontSize: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.text3,
    fontSize: 12,
    marginTop: 7,
  },
  columnTabs: {
    height: 54,
    flexGrow: 0,
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
  },
  columnTabsContent: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: theme.spacing.screenX,
  },
  columnTab: {
    maxWidth: 118,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: theme.colors.surface2,
  },
  columnTabActive: {
    backgroundColor: theme.colors.text1,
  },
  columnTabDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  columnTabText: {
    flexShrink: 1,
    color: theme.colors.text2,
    fontSize: 12,
  },
  columnTabTextActive: {
    color: theme.colors.white,
  },
  boardScroll: {
    flex: 1,
  },
  boardScrollContent: {
    paddingBottom: 92,
  },
  boardPager: {
    flexGrow: 0,
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
  pageDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  pageDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: theme.colors.border2,
  },
  pageDotActive: {
    width: 21,
    backgroundColor: theme.colors.text1,
  },
  detailScreen: {
    flex: 1,
    backgroundColor: theme.colors.surface1,
  },
  detailTopbar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
  },
  detailIconButton: {
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface1,
  },
  detailTopbarTitle: {
    flex: 1,
    color: theme.colors.text1,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    paddingHorizontal: theme.spacing.screenX,
    paddingTop: 18,
    paddingBottom: 34,
  },
  detailHero: {
    gap: 9,
    marginBottom: 18,
  },
  detailLabel: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  detailLabelText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  detailTitle: {
    color: theme.colors.text1,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '500',
  },
  detailListName: {
    color: theme.colors.text2,
    fontSize: 13,
  },
  detailMetaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  detailMetaItem: {
    flex: 1,
    minHeight: 76,
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 12,
    backgroundColor: theme.colors.surface2,
  },
  detailMetaLabel: {
    color: theme.colors.text3,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailMetaEmpty: {
    color: theme.colors.text2,
    fontSize: 13,
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
    marginRight: -7,
    borderWidth: 2,
    borderColor: theme.colors.surface2,
    borderRadius: 999,
  },
  detailMemberInitials: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  detailDuePill: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: theme.colors.surface3,
  },
  detailDueText: {
    color: theme.colors.text2,
    fontSize: 12,
  },
  detailActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  detailAction: {
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 10,
    backgroundColor: theme.colors.surface2,
  },
  detailActionText: {
    color: theme.colors.text1,
    fontSize: 12,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 22,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9,
    marginBottom: 10,
  },
  detailSectionTitleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  detailSectionTitle: {
    flexShrink: 1,
    color: theme.colors.text1,
    fontSize: 16,
    fontWeight: '600',
  },
  detailSectionAction: {
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: theme.colors.text1,
  },
  detailSectionActionDisabled: {
    borderWidth: 1,
    borderColor: theme.colors.border1,
    backgroundColor: theme.colors.surface3,
  },
  detailSectionActionText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  detailSectionActionTextDisabled: {
    color: theme.colors.text3,
  },
  detailDescriptionBox: {
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
    minHeight: 86,
    justifyContent: 'center',
    padding: 13,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 12,
    backgroundColor: theme.colors.surface2,
  },
  detailDescriptionText: {
    color: theme.colors.text2,
    fontSize: 14,
    lineHeight: 20,
  },
  detailDescriptionInput: {
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
    minHeight: 112,
    padding: 13,
    borderWidth: 1,
    borderColor: theme.colors.text1,
    borderRadius: 12,
    backgroundColor: theme.colors.surface1,
    color: theme.colors.text1,
    fontSize: 14,
    lineHeight: 20,
  },
  detailEmptyText: {
    color: theme.colors.text3,
    fontSize: 13,
    lineHeight: 19,
  },
  detailInfoRow: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 12,
    backgroundColor: theme.colors.surface2,
  },
  detailInfoText: {
    color: theme.colors.text2,
    fontSize: 13,
  },
  detailSecondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 9,
  },
  detailSecondaryAction: {
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 10,
    backgroundColor: theme.colors.surface1,
  },
  detailSecondaryActionText: {
    color: theme.colors.text1,
    fontSize: 12,
    fontWeight: '600',
  },
  detailComposer: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 5,
    borderWidth: 1,
    borderColor: theme.colors.border1,
    borderRadius: 13,
    backgroundColor: theme.colors.surface2,
  },
  detailCommentInput: {
    flex: 1,
    minHeight: 36,
    paddingHorizontal: 10,
    color: theme.colors.text1,
    fontSize: 13,
  },
  detailSendButton: {
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.text1,
  },
  detailActivityList: {
    gap: 12,
    marginTop: 14,
  },
  detailActivityItem: {
    flexDirection: 'row',
    gap: 10,
  },
  detailActivityAvatar: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  detailActivityInitials: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  detailActivityBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  detailActivityText: {
    color: theme.colors.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  detailActivityAuthor: {
    color: theme.colors.text1,
    fontWeight: '700',
  },
  detailActivityTime: {
    color: theme.colors.text3,
    fontSize: 11,
  },
})
