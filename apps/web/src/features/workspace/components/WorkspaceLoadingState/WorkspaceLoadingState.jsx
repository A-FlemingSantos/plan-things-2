import LoadingPlanCard from '../LoadingPlanCard/LoadingPlanCard.jsx'
import styles from '../../pages/Workspace/Workspace.module.css'

export default function WorkspaceLoadingState({ view }) {
  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>Carregando planos</h2>
        </div>
      </div>

      {view === 'grid' ? (
        <div className={styles.grid} aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <LoadingPlanCard key={`loading-grid-${index}`} view="grid" />
          ))}
        </div>
      ) : (
        <div className={styles.listView} aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <LoadingPlanCard key={`loading-list-${index}`} view="list" />
          ))}
        </div>
      )}
    </>
  )
}
