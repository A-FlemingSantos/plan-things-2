import { useMemo } from 'react'
import { usePlans } from '../../workspace/context/PlansContext.jsx'

function mapBoardColumnsToComposerCards(boardColumns) {
  if (!Array.isArray(boardColumns)) return []

  return boardColumns.flatMap((column) => (
    Array.isArray(column?.cards)
      ? column.cards.map((card) => ({
          id: card.id,
          title: card.title,
          columnTitle: column.title,
        }))
      : []
  ))
}

export function useIntelligenceComposerContext({ scope = 'workspace', boardColumns } = {}) {
  const { plans = [] } = usePlans()

  const boardCards = useMemo(() => (
    scope === 'board' ? mapBoardColumnsToComposerCards(boardColumns) : undefined
  ), [boardColumns, scope])

  return useMemo(() => ({
    planOptions: plans,
    boardCards,
  }), [boardCards, plans])
}

