import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export default function CanvasCard({
  card,
  selected,
  isConnectSource,
  isConnectTarget,
  tool,
  onPointerDown,
  onCardClick,
  onUpdate,
  onHeightChange,
  cardWidth,
  cardColors,
  MoreIcon,
  styles,
}) {
  const ref = useRef(null)
  const color = cardColors.find((candidate) => candidate.id === card.colorId) || cardColors[0]
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useLayoutEffect(() => {
    if (ref.current) {
      onHeightChange(card.id, ref.current.offsetHeight)
    }
  }, [card.content, card.id, card.title, cardWidth, onHeightChange])

  useEffect(() => {
    if (!showMenu) return

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showMenu])

  const isInteractive = tool === 'select'
  const cardCursor =
    tool === 'select' ? 'default' :
    tool === 'pan' ? 'grab' :
    tool === 'card' ? 'crosshair' :
    tool === 'connect' ? 'cell' :
    tool === 'delete' ? 'pointer' :
    'default'

  return (
    <div
      ref={ref}
      className={`
        ${styles.card}
        ${selected ? styles.cardSelected : ''}
        ${isConnectSource ? styles.cardConnectSource : ''}
        ${isConnectTarget ? styles.cardConnectTarget : ''}
        ${tool === 'delete' ? styles.cardDeleteHover : ''}
      `}
      style={{
        position: 'absolute',
        left: card.x,
        top: card.y,
        width: cardWidth,
        background: color.bg,
        borderColor: selected ? color.accent : color.border,
        cursor: cardCursor,
        '--accent': color.accent,
      }}
      onPointerDown={(event) => {
        if (tool !== 'pan') {
          event.stopPropagation()
        }
        onPointerDown(event, card.id)
      }}
      onClick={(event) => {
        event.stopPropagation()
        onCardClick(card.id)
      }}
    >
      <div className={styles.cardAccent} style={{ background: color.accent }} />

      <div className={styles.cardInner}>
        <div className={styles.cardTitleRow}>
          <input
            className={styles.cardTitle}
            value={card.title}
            placeholder="Sem título"
            readOnly={!isInteractive}
            tabIndex={isInteractive ? 0 : -1}
            onChange={(event) => onUpdate({ ...card, title: event.target.value })}
            onPointerDown={(event) => {
              if (isInteractive) event.stopPropagation()
            }}
            onClick={(event) => {
              if (isInteractive) event.stopPropagation()
            }}
            style={{ cursor: isInteractive ? 'text' : 'inherit', color: color.accent }}
          />

          {isInteractive ? (
            <div className={styles.cardMenuWrap} ref={menuRef}>
              <button
                className={styles.cardMenuBtn}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation()
                  setShowMenu((value) => !value)
                }}
              >
                <MoreIcon />
              </button>

              {showMenu ? (
                <div className={styles.cardMenu}>
                  <div className={styles.cardMenuColors}>
                    {cardColors.map((candidate) => (
                      <button
                        key={candidate.id}
                        className={`${styles.cardMenuSwatch} ${card.colorId === candidate.id ? styles.cardMenuSwatchActive : ''}`}
                        style={{ background: candidate.accent }}
                        onClick={() => {
                          onUpdate({ ...card, colorId: candidate.id })
                          setShowMenu(false)
                        }}
                        title={candidate.id}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <textarea
          className={styles.cardContent}
          value={card.content}
          placeholder="Adicionar conteúdo..."
          rows={3}
          readOnly={!isInteractive}
          tabIndex={isInteractive ? 0 : -1}
          onChange={(event) => onUpdate({ ...card, content: event.target.value })}
          onPointerDown={(event) => {
            if (isInteractive) event.stopPropagation()
          }}
          onClick={(event) => {
            if (isInteractive) event.stopPropagation()
          }}
          style={{ cursor: isInteractive ? 'text' : 'inherit' }}
        />
      </div>

      {tool === 'connect' ? (
        <>
          <div className={styles.portLeft} />
          <div className={styles.portRight} />
        </>
      ) : null}
    </div>
  )
}
