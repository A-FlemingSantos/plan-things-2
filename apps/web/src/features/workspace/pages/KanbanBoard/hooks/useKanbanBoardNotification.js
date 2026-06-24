import { useTransientNotification } from '../../../../../shared/hooks/useTransientNotification.js'

export function useKanbanBoardNotification() {
  const { notification, pushNotification } = useTransientNotification()

  return {
    notification,
    showNotification: pushNotification,
  }
}
