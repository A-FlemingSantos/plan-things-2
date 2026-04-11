export default function CanvasEmptyHint({ tool, CardIcon, styles }) {
  if (tool !== 'card') return null

  return (
    <div className={styles.emptyHint} style={{ pointerEvents: 'none' }}>
      <span className={styles.emptyHintIcon}><CardIcon /></span>
      Clique no Canvas para criar um cartão
    </div>
  )
}
