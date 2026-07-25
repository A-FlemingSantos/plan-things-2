import LoadingScreen from '../../../../../shared/components/Loader/LoadingScreen.jsx'
import styles from '../KanbanBoard.module.css'

export default function BoardLoadingState() {
  return (
    <LoadingScreen
      className={styles.boardLoadingScreen}
      label="Carregando quadro"
    />
  )
}
