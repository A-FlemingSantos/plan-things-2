import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../../../../shared/api/apiClient.js'
import { describeInboxError } from '../utils/kanbanBoardInboxUtils.js'

export function useKanbanBoardInbox({
  activePlan,
  isBackendDriven,
  accessToken,
  ensurePlanDetails,
  isInboxPanelMounted,
  columns,
  updateColumns,
  setActiveCard,
  showNotification,
}) {
  const [inboxRecipientCard, setInboxRecipientCard] = useState(null)
  const [inboxSelectedMemberIds, setInboxSelectedMemberIds] = useState([])
  const [inboxSendingCardId, setInboxSendingCardId] = useState('')
  const [inboxError, setInboxError] = useState('')
  const [inboxItems, setInboxItems] = useState([])
  const [isClearingInbox, setIsClearingInbox] = useState(false)

  const handleInboxCardDrop = useCallback((cardId) => {
    const card = columns.flatMap((column) => column.cards).find((item) => item.id === cardId) ?? null
    if (!card) {
      showNotification('Não foi possível identificar o cartão arrastado.')
      return
    }

    setInboxRecipientCard(card)
    setInboxSelectedMemberIds([])
    setInboxError('')
  }, [columns, showNotification])

  const resetInboxRecipientState = useCallback(() => {
    setInboxRecipientCard(null)
    setInboxSelectedMemberIds([])
    setInboxError('')
  }, [])

  const mergeInboxRecipientsIntoCard = useCallback((cardId, recipientUserIds) => {
    const selectedIds = [...new Set(recipientUserIds.filter(Boolean))]
    if (!selectedIds.length) return

    const mergeMemberIds = (card) => [...new Set([...(card.memberIds ?? []), ...selectedIds])]
    updateColumns((currentColumns) => currentColumns.map((column) => ({
      ...column,
      cards: column.cards.map((card) => (
        card.id === cardId ? { ...card, memberIds: mergeMemberIds(card) } : card
      )),
    })))
    setActiveCard((current) => {
      if (current?.card?.id !== cardId) return current
      return {
        ...current,
        card: {
          ...current.card,
          memberIds: mergeMemberIds(current.card),
        },
      }
    })
  }, [setActiveCard, updateColumns])

  const prependInboxItem = useCallback((item) => {
    if (!item?.id) return
    setInboxItems((current) => [
      item,
      ...current.filter((existing) => existing.id !== item.id),
    ])
  }, [])

  const clearInboxDeliveries = useCallback(async () => {
    if (!activePlan?.id || !isBackendDriven) {
      showNotification('Histórico da Inbox fica disponível apenas quando a sessão está conectada ao backend.')
      return
    }
    if (!inboxItems.length || isClearingInbox) return

    setIsClearingInbox(true)
    setInboxError('')

    try {
      await apiRequest(`/api/plans/${activePlan.id}/board/inbox/deliveries`, {
        method: 'DELETE',
        token: accessToken,
      })
      setInboxItems([])
      showNotification('Envios da Inbox limpos.')
    } catch (error) {
      const message = error?.message ?? 'Não foi possível limpar os envios da Inbox.'
      setInboxError(message)
      showNotification(message)
    } finally {
      setIsClearingInbox(false)
    }
  }, [accessToken, activePlan?.id, inboxItems.length, isBackendDriven, isClearingInbox, showNotification])

  const sendCardToInbox = useCallback(async (card, recipientUserIds = []) => {
    if (!activePlan?.id || !isBackendDriven || !card?.id) {
      showNotification('Envio por Gmail fica disponível apenas quando a sessão está conectada ao backend.')
      return
    }
    const newRecipientUserIds = recipientUserIds.filter((id) => !(card.memberIds ?? []).includes(id))
    if (!newRecipientUserIds.length) {
      const message = 'Escolha ao menos um novo membro para receber este cartão por e-mail.'
      setInboxError(message)
      showNotification(message)
      return
    }

    setInboxSendingCardId(card.id)
    setInboxError('')

    try {
      const delivery = await apiRequest(`/api/plans/${activePlan.id}/board/cards/${card.id}/inbox/send`, {
        method: 'POST',
        token: accessToken,
        body: { recipientUserIds: newRecipientUserIds },
      })
      const total = Array.isArray(delivery?.sentTo) ? delivery.sentTo.length : 0
      showNotification(total > 1 ? `E-mail enviado para ${total} membros.` : 'E-mail enviado para 1 membro.')
      mergeInboxRecipientsIntoCard(card.id, newRecipientUserIds)
      prependInboxItem(delivery?.inboxItem)
      setInboxRecipientCard(null)
      setInboxSelectedMemberIds([])
    } catch (error) {
      const message = describeInboxError(error)
      setInboxError(message)
      showNotification(message)
    } finally {
      setInboxSendingCardId('')
    }
  }, [accessToken, activePlan?.id, isBackendDriven, mergeInboxRecipientsIntoCard, prependInboxItem, showNotification])

  const toggleInboxRecipient = useCallback((memberId) => {
    setInboxSelectedMemberIds((current) => (
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    ))
  }, [])

  const submitInboxRecipients = useCallback(() => {
    if (!inboxRecipientCard) return
    if (!inboxSelectedMemberIds.length) {
      setInboxError('Escolha ao menos um novo membro para receber este cartão por e-mail.')
      return
    }

    sendCardToInbox(inboxRecipientCard, inboxSelectedMemberIds)
  }, [inboxRecipientCard, inboxSelectedMemberIds, sendCardToInbox])

  useEffect(() => {
    if (!isInboxPanelMounted) return
    if (!isBackendDriven) return
    if (!activePlan?.id) return
    if (activePlan.detailsLoaded) return

    ensurePlanDetails(activePlan.id).catch((error) => {
      setInboxError(error?.message ?? 'Não foi possível carregar os membros deste plano.')
    })
  }, [activePlan?.detailsLoaded, activePlan?.id, ensurePlanDetails, isBackendDriven, isInboxPanelMounted])

  useEffect(() => {
    setInboxItems(Array.isArray(activePlan?.inboxItems) ? activePlan.inboxItems : [])
  }, [activePlan?.id, activePlan?.inboxItems])

  return {
    inboxRecipientCard,
    setInboxRecipientCard,
    inboxSelectedMemberIds,
    inboxSendingCardId,
    inboxError,
    setInboxError,
    inboxItems,
    isClearingInbox,
    handleInboxCardDrop,
    resetInboxRecipientState,
    clearInboxDeliveries,
    toggleInboxRecipient,
    submitInboxRecipients,
  }
}
