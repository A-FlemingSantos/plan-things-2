import { useCallback, useLayoutEffect, useRef } from 'react'
import {
  clearStackStyles,
  measureCardRects,
  playKanbanFilterFlip,
  prefersReducedMotion,
} from './kanbanColumnFilterFlip.js'

function motionSignature(cards, getMotion) {
  return cards.map((card) => `${card.id}:${getMotion(card.id)}`).join('|')
}

function readStackHeight(stackRef, viewportRef) {
  const node = stackRef?.current ?? viewportRef?.current
  if (!node) return 0
  return node.offsetHeight
}

export function useKanbanColumnFilterFlip({
  displayedCards,
  getMotion,
  completeMotion,
  paused,
  viewportRef,
  stackRef,
}) {
  const nodesRef = useRef(new Map())
  const idleRectsRef = useRef(new Map())
  const idleStackHeightRef = useRef(null)
  const playingRef = useRef(false)
  const displayedCardsRef = useRef(displayedCards)
  const getMotionRef = useRef(getMotion)
  const completeMotionRef = useRef(completeMotion)
  displayedCardsRef.current = displayedCards
  getMotionRef.current = getMotion
  completeMotionRef.current = completeMotion

  const signature = motionSignature(displayedCards, getMotion)

  const registerCardNode = useCallback((cardId, node) => {
    if (node) nodesRef.current.set(cardId, node)
    else nodesRef.current.delete(cardId)
  }, [])

  const recordIdleSnapshot = useCallback(() => {
    idleRectsRef.current = measureCardRects(nodesRef.current)
    idleStackHeightRef.current = readStackHeight(stackRef, viewportRef)
    clearStackStyles(stackRef?.current)
    if (viewportRef?.current && viewportRef.current !== stackRef?.current) {
      clearStackStyles(viewportRef.current)
    }
  }, [stackRef, viewportRef])

  useLayoutEffect(() => {
    const cards = displayedCardsRef.current
    const motionsById = {}
    for (const card of cards) {
      motionsById[card.id] = getMotionRef.current(card.id)
    }

    const hasMotion = Object.values(motionsById).some(
      (motion) => motion === 'entering' || motion === 'exiting',
    )
    const skipAnimation = paused || prefersReducedMotion()

    if (!hasMotion || skipAnimation) {
      playingRef.current = false
      if (hasMotion && skipAnimation) {
        for (const [id, motion] of Object.entries(motionsById)) {
          if (motion === 'entering' || motion === 'exiting') {
            completeMotionRef.current(id)
          }
        }
      }
      recordIdleSnapshot()
      return undefined
    }

    playingRef.current = true
    const firstRects = idleRectsRef.current.size > 0
      ? idleRectsRef.current
      : measureCardRects(nodesRef.current)
    const firstHeight = idleStackHeightRef.current == null
      ? readStackHeight(stackRef, viewportRef)
      : idleStackHeightRef.current

    const stop = playKanbanFilterFlip({
      viewport: viewportRef.current,
      stack: stackRef?.current ?? viewportRef.current,
      nodesById: nodesRef.current,
      firstRects,
      firstHeight,
      motionsById,
      onComplete: (id) => completeMotionRef.current(id),
    })

    return () => {
      playingRef.current = false
      stop?.()
    }
  }, [paused, recordIdleSnapshot, signature, stackRef, viewportRef])

  useLayoutEffect(() => {
    if (playingRef.current) return
    recordIdleSnapshot()
  })

  return registerCardNode
}
