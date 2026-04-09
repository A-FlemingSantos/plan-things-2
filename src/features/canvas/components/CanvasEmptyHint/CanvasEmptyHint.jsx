export default function CanvasEmptyHint({ tool, CardIcon, styles }) {
  if (tool !== 'card') return null

  return (
    <div className={styles.emptyHint} style={{ pointerEvents: 'none' }}>
      <span className={styles.emptyHintIcon}><CardIcon /></span>
      Click anywhere on the canvas to place a card
    </div>
  )
}
