export default function BoardLoadingState({ styles }) {
  return (
    <div className={styles.board} aria-hidden="true">
      {Array.from({ length: 4 }, (_, columnIndex) => (
        <div key={`board-loading-${columnIndex}`} className={styles.boardLoadingColumn}>
          <div className={styles.boardLoadingColumnHeader}>
            <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingColumnTitle}`} />
            <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingColumnMeta}`} />
          </div>
          <div className={styles.boardLoadingCards}>
            {Array.from({ length: 3 }, (_, cardIndex) => (
              <div key={`board-loading-${columnIndex}-${cardIndex}`} className={styles.boardLoadingCard}>
                <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingCardTitle}`} />
                <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingCardText}`} />
                <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingCardTextShort}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
