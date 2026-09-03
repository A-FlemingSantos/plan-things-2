import { useCallback, useMemo, useState } from 'react'
import { uploadPlanCoverFile } from '../components/workspaceCover/workspaceCoverUtils.js'

export function usePlanBackgroundPicker({
  plans,
  updatePlanCover,
  isBackendDriven = false,
  accessToken,
  onNotify,
}) {
  const [backgroundPicker, setBackgroundPicker] = useState(null)
  const [backgroundBusy, setBackgroundBusy] = useState(false)

  const backgroundPickerPlan = useMemo(() => (
    backgroundPicker?.planId
      ? plans.find((plan) => plan.id === backgroundPicker.planId) ?? null
      : null
  ), [backgroundPicker, plans])

  const openBackgroundPicker = useCallback((planId, anchorRect) => {
    if (!planId) return
    setBackgroundPicker({ planId, anchorRect })
  }, [])

  const closeBackgroundPicker = useCallback(() => {
    if (!backgroundBusy) {
      setBackgroundPicker(null)
    }
  }, [backgroundBusy])

  const dismissBackgroundPicker = useCallback(() => {
    setBackgroundPicker(null)
  }, [])

  const handleSelectTheme = useCallback(async (theme) => {
    const plan = plans.find((item) => item.id === backgroundPicker?.planId)
    if (!plan || backgroundBusy) return
    setBackgroundBusy(true)
    try {
      await updatePlanCover(plan.id, {
        cover: theme.cardCover,
        coverThemeId: theme.id,
        coverImageId: null,
        coverImage: null,
        coverImageThumb: null,
      })
      setBackgroundPicker(null)
      onNotify?.(`Background de "${plan.name}" atualizado`)
    } catch (error) {
      onNotify?.(error.message ?? 'Nao foi possivel alterar o background do plano.')
    } finally {
      setBackgroundBusy(false)
    }
  }, [backgroundBusy, backgroundPicker?.planId, onNotify, plans, updatePlanCover])

  const handleSelectImage = useCallback(async (image) => {
    const plan = plans.find((item) => item.id === backgroundPicker?.planId)
    if (!plan || backgroundBusy) return
    setBackgroundBusy(true)
    try {
      let coverImageId = image.id
      const coverImage = image.fullUrl ?? image.url
      const coverImageThumb = image.url

      if (image.isCustomUpload) {
        if (image.sourceFile instanceof File && isBackendDriven && accessToken) {
          const fileId = await uploadPlanCoverFile(image.sourceFile, accessToken)
          coverImageId = `files/${fileId}`
        } else {
          coverImageId = null
        }
      }

      await updatePlanCover(plan.id, {
        cover: plan.cover ?? null,
        coverThemeId: null,
        coverImageId,
        coverImage,
        coverImageThumb,
      })
      setBackgroundPicker(null)
      onNotify?.(`Background de "${plan.name}" atualizado`)
    } catch (error) {
      onNotify?.(error.message ?? 'Nao foi possivel alterar o background do plano.')
    } finally {
      setBackgroundBusy(false)
    }
  }, [
    accessToken,
    backgroundBusy,
    backgroundPicker?.planId,
    isBackendDriven,
    onNotify,
    plans,
    updatePlanCover,
  ])

  return {
    backgroundPicker,
    backgroundPickerPlan,
    backgroundBusy,
    openBackgroundPicker,
    closeBackgroundPicker,
    dismissBackgroundPicker,
    handleSelectTheme,
    handleSelectImage,
  }
}
