import { useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { ArrowLeft, Clock3, MessageCircle, Plus, Users } from 'lucide-react-native'
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

function BoardCard({ card }) {
  const label = findLabel(card.labelId)
  const members = findMembers(card.memberIds)
  const hasMeta = Boolean(card.dueDate || card.comments?.length || members.length)

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
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

function BoardColumn({ column, width, onLayout }) {
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
            <BoardCard key={card.id} card={card} />
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
  const verticalScrollRef = useRef(null)
  const scrollRef = useRef(null)
  const { width } = useWindowDimensions()
  const pageWidth = Math.min(width, 430)
  const activeColumnHeight = columnHeights[columns[activeColumnIndex]?.id]
  const totalCards = useMemo(
    () => columns.reduce((sum, column) => sum + column.cards.length, 0),
    [columns],
  )

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
    setActiveColumnIndex(nextIndex)
    verticalScrollRef.current?.scrollTo({ y: 0, animated: false })
  }

  const goToColumn = (index) => {
    setActiveColumnIndex(index)
    verticalScrollRef.current?.scrollTo({ y: 0, animated: false })
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
})
