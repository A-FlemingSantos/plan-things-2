import styles from '../../pages/Workspace/Workspace.module.css'

export default function LoadingPlanCard({ view }) {
  if (view === 'list') {
    return (
      <div className={styles.loadingListCard} aria-hidden="true">
        <span className={`${styles.loadingBlock} ${styles.loadingListCover}`} />
        <div className={styles.loadingListInfo}>
          <span className={`${styles.loadingBlock} ${styles.loadingListTitle}`} />
          <span className={`${styles.loadingBlock} ${styles.loadingListMeta}`} />
        </div>
        <span className={`${styles.loadingBlock} ${styles.loadingListBadge}`} />
      </div>
    )
  }

  return (
    <div className={styles.loadingPlanCard} aria-hidden="true">
      <div className={styles.loadingPlanCardBody}>
        <div className={styles.loadingPlanCardTop}>
          <span className={`${styles.loadingBlock} ${styles.loadingChip}`} />
          <span className={`${styles.loadingBlock} ${styles.loadingDate}`} />
        </div>
        <span className={`${styles.loadingBlock} ${styles.loadingTitle}`} />
        <span className={`${styles.loadingBlock} ${styles.loadingText}`} />
        <span className={`${styles.loadingBlock} ${styles.loadingTextShort}`} />
        <div className={styles.loadingPlanCardFooter}>
          <div className={styles.loadingMemberStack}>
            <span className={styles.loadingAvatar} />
            <span className={styles.loadingAvatar} />
            <span className={styles.loadingAvatar} />
          </div>
          <span className={`${styles.loadingBlock} ${styles.loadingMeta}`} />
        </div>
      </div>
    </div>
  )
}
