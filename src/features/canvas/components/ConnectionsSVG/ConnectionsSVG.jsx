import { useCallback } from 'react'

export default function ConnectionsSVG({
  connections,
  cards,
  pan,
  zoom,
  cardHeights,
  tool,
  onDeleteConn,
  connectFrom,
  svgMouse,
  cardWidth,
  styles,
}) {
  const getCardBounds = useCallback((cardId) => {
    const card = cards.find((candidate) => candidate.id === cardId)
    if (!card) return null

    const height = cardHeights.current[cardId] || 130

    return {
      centerX: (card.x + cardWidth / 2) * zoom + pan.x,
      centerY: (card.y + height / 2) * zoom + pan.y,
      halfWidth: (cardWidth * zoom) / 2,
      halfHeight: (height * zoom) / 2,
    }
  }, [cardHeights, cardWidth, cards, pan.x, pan.y, zoom])

  const getCardEdgePoint = useCallback((cardId, targetPoint) => {
    const bounds = getCardBounds(cardId)
    if (!bounds) return null

    const dx = targetPoint.x - bounds.centerX
    const dy = targetPoint.y - bounds.centerY

    if (dx === 0 && dy === 0) {
      return { x: bounds.centerX, y: bounds.centerY }
    }

    const scaleX = dx === 0 ? Number.POSITIVE_INFINITY : bounds.halfWidth / Math.abs(dx)
    const scaleY = dy === 0 ? Number.POSITIVE_INFINITY : bounds.halfHeight / Math.abs(dy)
    const scale = Math.min(scaleX, scaleY)

    return {
      x: bounds.centerX + dx * scale,
      y: bounds.centerY + dy * scale,
    }
  }, [getCardBounds])

  const makePath = (sx, sy, ex, ey) => {
    const midX = (sx + ex) / 2
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${midX.toFixed(1)} ${sy.toFixed(1)}, ${midX.toFixed(1)} ${ey.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`
  }

  let inProgress = null
  if (connectFrom && svgMouse) {
    const source = getCardEdgePoint(connectFrom, svgMouse)
    if (source) {
      inProgress = makePath(source.x, source.y, svgMouse.x, svgMouse.y)
    }
  }

  return (
    <svg className={styles.connectionsSvg} style={{ pointerEvents: 'none' }}>
      <defs>
        <marker id="arrowNormal" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0 0.5 L7.5 3 L0 5.5 Z" fill="#a0a0a0" />
        </marker>
        <marker id="arrowDelete" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0 0.5 L7.5 3 L0 5.5 Z" fill="#ff6766" />
        </marker>
      </defs>

      {connections.map((connection) => {
        const sourceBounds = getCardBounds(connection.from)
        const destinationBounds = getCardBounds(connection.to)
        if (!sourceBounds || !destinationBounds) return null

        const source = getCardEdgePoint(connection.from, { x: destinationBounds.centerX, y: destinationBounds.centerY })
        const destination = getCardEdgePoint(connection.to, { x: sourceBounds.centerX, y: sourceBounds.centerY })
        if (!source || !destination) return null

        const path = makePath(source.x, source.y, destination.x, destination.y)
        const isDeleteMode = tool === 'delete'

        return (
          <g key={connection.id}>
            <path
              d={path}
              stroke="transparent"
              strokeWidth={isDeleteMode ? 18 : 10}
              fill="none"
              style={{ cursor: isDeleteMode ? 'pointer' : 'default', pointerEvents: 'stroke' }}
              onClick={() => isDeleteMode && onDeleteConn(connection.id)}
            />
            <path
              d={path}
              stroke={isDeleteMode ? '#ff6766' : '#c8c8c8'}
              strokeWidth={isDeleteMode ? 2 : 1.5}
              fill="none"
              strokeDasharray={isDeleteMode ? '4 3' : 'none'}
              markerEnd={`url(#${isDeleteMode ? 'arrowDelete' : 'arrowNormal'})`}
              style={{ pointerEvents: 'none', transition: 'stroke 0.15s ease' }}
            />
          </g>
        )
      })}

      {inProgress ? (
        <path
          d={inProgress}
          stroke="#4290da"
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="6 4"
          opacity={0.8}
        />
      ) : null}
    </svg>
  )
}
