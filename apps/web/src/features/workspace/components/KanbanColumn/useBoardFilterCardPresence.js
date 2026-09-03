import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

export const BOARD_FILTER_CARD_MOTION_MS = 180

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
}

function cardMatches(cardId, matchingCardIds) {
  return matchingCardIds == null || matchingCardIds.has(cardId)
}

export function useBoardFilterCardPresence(cards = [], matchingCardIds = null, paused = false) {
  const [presenceById, setPresenceById] = useState(() => {
    const initial = {}
    for (const card of cards) {
      if (cardMatches(card.id, matchingCardIds)) {
        initial[card.id] = 'in'
      }
    }
    return initial
  })
  const knownCardIdsRef = useRef(null)
  const knownUiKeysRef = useRef(null)

  useLayoutEffect(() => {
    const knownIds = knownCardIdsRef.current ?? new Set(cards.map((card) => card.id))
    const knownUiKeys = knownUiKeysRef.current
      ?? new Set(cards.map((card) => card.uiKey).filter(Boolean))

    setPresenceById((previous) => {
      const next = {}
      const reduced = prefersReducedMotion()

      for (const card of cards) {
        const matches = cardMatches(card.id, matchingCardIds)
        const previousMotion = previous[card.id]

        if (paused) {
          if (previousMotion) {
            next[card.id] = previousMotion
          } else if (matches) {
            next[card.id] = 'in'
          }
          continue
        }

        if (matches) {
          if (!previousMotion) {
            if (reduced || (card.uiKey && knownUiKeys.has(card.uiKey))) {
              next[card.id] = 'in'
            } else if (!knownIds.has(card.id)) {
              next[card.id] = 'created'
            } else {
              next[card.id] = 'entering'
            }
          } else if (previousMotion === 'exiting') {
            next[card.id] = reduced ? 'in' : 'entering'
          } else {
            next[card.id] = previousMotion
          }
          continue
        }

        if (!previousMotion) {
          continue
        }

        if (reduced) {
          continue
        }

        next[card.id] = 'exiting'
      }

      const previousIds = Object.keys(previous)
      const nextIds = Object.keys(next)
      const unchanged = previousIds.length === nextIds.length
        && nextIds.every((id) => previous[id] === next[id])

      return unchanged ? previous : next
    })

    knownCardIdsRef.current = new Set(cards.map((card) => card.id))
    knownUiKeysRef.current = new Set(cards.map((card) => card.uiKey).filter(Boolean))
  }, [cards, matchingCardIds, paused])

  const completeMotion = useCallback((cardId) => {
    setPresenceById((previous) => {
      const motion = previous[cardId]
      if (motion === 'exiting') {
        if (!(cardId in previous)) return previous
        const next = { ...previous }
        delete next[cardId]
        return next
      }
      if (motion === 'entering' || motion === 'created') {
        return { ...previous, [cardId]: 'in' }
      }
      return previous
    })
  }, [])

  const displayCards = useMemo(
    () => cards.filter((card) => Boolean(presenceById[card.id])),
    [cards, presenceById],
  )

  const getMotion = useCallback(
    (cardId) => presenceById[cardId] ?? 'in',
    [presenceById],
  )

  return {
    displayCards,
    getMotion,
    completeMotion,
  }
}
