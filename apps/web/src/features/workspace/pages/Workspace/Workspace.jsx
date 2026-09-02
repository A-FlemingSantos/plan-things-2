import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { apiRequest, triggerBlobDownload } from '../../../../shared/api/apiClient.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import { usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import { usePlans } from '../../context/PlansContext.jsx'
import { useTransientNotification } from '../../../../shared/hooks/useTransientNotification.js'
import NewPlanPopover from '../../components/NewPlanPopover/NewPlanPopover.jsx'
import PlanBackgroundPicker from '../../components/PlanBackgroundPicker/PlanBackgroundPicker.jsx'
import PlanCard from '../../components/PlanCard/PlanCard.jsx'
import WorkspaceLoadingState from '../../components/WorkspaceLoadingState/WorkspaceLoadingState.jsx'
import {
  GridIcon,
  ListIcon,
  PlusIcon,
} from '../../components/WorkspaceIcons/WorkspaceIcons.jsx'
import { uploadPlanCoverFile } from '../../components/workspaceCover/workspaceCoverUtils.js'
import styles from './Workspace.module.css'

export default function Workspace() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { accessToken } = useAuth()
  const [view,         setView]         = useState('grid')
  const [newPlanAnchor, setNewPlanAnchor] = useState(null)
  const { notification, pushNotification, setNotification } = useTransientNotification()
  const [openPlanMenuId, setOpenPlanMenuId] = useState(null)
  const [planMenuAnchorRect, setPlanMenuAnchorRect] = useState(null)
  const [renamingPlan, setRenamingPlan] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [renameBusy, setRenameBusy] = useState(false)
  const [backgroundPicker, setBackgroundPicker] = useState(null)
  const [backgroundBusy, setBackgroundBusy] = useState(false)
  const handledFileDeepLinkRef = useRef('')
  const { plans, activePlan, createPlan, deletePlan, renamePlan, updatePlanCover, selectPlan, isBackendDriven, isLoading } = usePlans()
  const { localPreferences } = usePreferences()
  const confirmDestructiveActions = localPreferences.confirmDestructiveActions ?? true
  const hasVisiblePlans = plans.length > 0
  const backgroundPickerPlan = backgroundPicker?.planId
    ? plans.find((plan) => plan.id === backgroundPicker.planId) ?? null
    : null
  const fileIdFromUrl = String(searchParams.get('file') ?? '').trim()

  useEffect(() => {
    if (!fileIdFromUrl) {
      handledFileDeepLinkRef.current = ''
      return undefined
    }
    if (handledFileDeepLinkRef.current === fileIdFromUrl) {
      return undefined
    }

    handledFileDeepLinkRef.current = fileIdFromUrl
    let cancelled = false

    const clearFileParam = () => {
      const nextParams = new URLSearchParams(searchParams)
      if (nextParams.get('file') === fileIdFromUrl) {
        nextParams.delete('file')
        setSearchParams(nextParams, { replace: true })
      }
    }

    if (!isBackendDriven || !accessToken) {
      pushNotification('Arquivos ficam disponíveis quando a sessão está conectada ao backend.')
      clearFileParam()
      return undefined
    }

    apiRequest(`/api/files/${fileIdFromUrl}/download`, {
      token: accessToken,
      responseType: 'blob',
    })
      .then((blob) => {
        if (cancelled) return
        triggerBlobDownload(blob, `arquivo-${fileIdFromUrl.slice(0, 8)}`)
        pushNotification('Download do arquivo iniciado.')
      })
      .catch((error) => {
        if (cancelled) return
        pushNotification(error?.message ?? 'Não foi possível abrir este arquivo.')
      })
      .finally(() => {
        if (!cancelled) {
          clearFileParam()
        }
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, fileIdFromUrl, isBackendDriven, searchParams, setSearchParams])

  const handleNewPlan = async (data) => {
    try {
      let payload = data

      if (data.sourceFile instanceof File && isBackendDriven && accessToken) {
        const fileId = await uploadPlanCoverFile(data.sourceFile, accessToken)
        payload = {
          ...data,
          coverImageId: `files/${fileId}`,
          coverImage: data.coverImage ?? null,
          coverImageThumb: data.coverImageThumb ?? data.coverImage ?? null,
          sourceFile: null,
        }
      }

      const newPlan = await createPlan(payload)
      pushNotification(`Plano "${newPlan.name}" criado`)
    } catch (error) {
      setNotification(error.message ?? 'Nao foi possivel criar o plano.')
    }
  }

  const handleDeletePlan = async (plan) => {
    if (!plan?.id) return
    if (confirmDestructiveActions && !window.confirm(`Excluir o plano "${plan.name}"?`)) {
      return
    }
    try {
      await deletePlan(plan.id)
      setOpenPlanMenuId(null)
      setPlanMenuAnchorRect(null)
      pushNotification(`Plano "${plan.name}" excluido`)
    } catch (error) {
      pushNotification(error.message ?? 'Nao foi possivel excluir o plano.')
    }
  }

  const cancelRename = () => {
    if (renameBusy) return
    setRenamingPlan(null)
    setRenameDraft('')
  }

  const startInlineRename = (plan) => {
    setOpenPlanMenuId(null)
    setPlanMenuAnchorRect(null)
    setBackgroundPicker(null)
    setRenamingPlan(plan)
    setRenameDraft(plan?.name ?? '')
  }

  const commitInlineRename = async () => {
    if (renameBusy || !renamingPlan?.id) return
    const nextName = renameDraft.trim()
    if (!nextName) {
      cancelRename()
      return
    }
    if (nextName === (renamingPlan.name ?? '')) {
      cancelRename()
      return
    }
    setRenameBusy(true)
    try {
      const renamed = await renamePlan(renamingPlan.id, nextName)
      setRenamingPlan(null)
      setRenameDraft('')
      pushNotification(`Plano "${renamed.name}" renomeado`)
    } catch (error) {
      pushNotification(error.message ?? 'Nao foi possivel renomear o plano.')
    } finally {
      setRenameBusy(false)
    }
  }

  const handlePlanBackgroundTheme = async (theme) => {
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
      pushNotification(`Background de "${plan.name}" atualizado`)
    } catch (error) {
      pushNotification(error.message ?? 'Nao foi possivel alterar o background do plano.')
    } finally {
      setBackgroundBusy(false)
    }
  }

  const handlePlanBackgroundImage = async (image) => {
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
      pushNotification(`Background de "${plan.name}" atualizado`)
    } catch (error) {
      pushNotification(error.message ?? 'Nao foi possivel alterar o background do plano.')
    } finally {
      setBackgroundBusy(false)
    }
  }

  const handlePlanMenuAction = (plan, action) => {
    const anchorRect = planMenuAnchorRect
    setOpenPlanMenuId(null)
    setPlanMenuAnchorRect(null)
    if (action === 'board') {
      setBackgroundPicker(null)
      openBoard(plan.id)
    } else if (action === 'rename') {
      startInlineRename(plan)
    } else if (action === 'background') {
      setRenamingPlan(null)
      setRenameDraft('')
      setBackgroundPicker({ planId: plan.id, anchorRect })
    } else if (action === 'delete') {
      setBackgroundPicker(null)
      void handleDeletePlan(plan)
    }
  }

  useEffect(() => {
    if (!openPlanMenuId) return undefined
    const handleDismiss = () => {
      setOpenPlanMenuId(null)
      setPlanMenuAnchorRect(null)
    }
    window.addEventListener('resize', handleDismiss)
    window.addEventListener('scroll', handleDismiss, true)
    return () => {
      window.removeEventListener('resize', handleDismiss)
      window.removeEventListener('scroll', handleDismiss, true)
    }
  }, [openPlanMenuId])

  const closePlanMenu = () => {
    setOpenPlanMenuId(null)
    setPlanMenuAnchorRect(null)
  }

  const openBoard = (plan) => {
    setBackgroundPicker(null)
    selectPlan(plan.id)
    navigate(buildWorkspaceBoardPath(plan))
  }

  const openNewPlan = (event) => {
    setNewPlanAnchor(event.currentTarget)
  }

  const renderPlanCard = (plan, cardView = view) => (
    <PlanCard
      key={plan.id}
      plan={plan}
      view={cardView}
      onOpen={() => openBoard(plan)}
      onMore={(anchorRect) => {
        setOpenPlanMenuId((current) => (current === plan.id ? null : plan.id))
        setPlanMenuAnchorRect(openPlanMenuId === plan.id ? null : anchorRect)
      }}
      menuOpen={openPlanMenuId === plan.id}
      menuAnchorRect={planMenuAnchorRect}
      onMenuAction={(action) => handlePlanMenuAction(plan, action)}
      onMenuClose={closePlanMenu}
      isRenaming={renamingPlan?.id === plan.id}
      renameDraft={renameDraft}
      renameBusy={renameBusy}
      onRenameDraftChange={setRenameDraft}
      onRenameCommit={commitInlineRename}
      onRenameCancel={cancelRename}
      isActive={plan.id === activePlan?.id}
    />
  )

  const renderPlanCollection = (planList, { includeNewPlanCard = false, gridClassName = styles.grid } = {}) => {
    if (planList.length === 0 && !includeNewPlanCard) {
      return null
    }

    if (view === 'grid') {
      return (
        <div className={gridClassName}>
          {planList.map((plan) => renderPlanCard(plan, 'grid'))}
          {includeNewPlanCard ? (
            <button className={styles.newPlanCard} onClick={openNewPlan}>
              <span className={styles.newPlanIcon}><PlusIcon /></span>
              <span className={styles.newPlanLabel}>Novo plano</span>
            </button>
          ) : null}
        </div>
      )
    }

    return (
      <div className={styles.listView}>
        {planList.map((plan) => renderPlanCard(plan, 'list'))}
      </div>
    )
  }

  const sectionControls = (
    <div className={styles.sectionControls}>
      <div className={styles.viewToggle}>
        <button
          className={`${styles.viewBtn} ${view === 'grid' ? styles.viewBtnActive : ''}`}
          onClick={() => setView('grid')}
          aria-label="Visualização em grade"
        ><GridIcon /></button>
        <button
          className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
          onClick={() => setView('list')}
          aria-label="Visualização em lista"
        ><ListIcon /></button>
      </div>
    </div>
  )

  const plansSectionContent = (
    <div className={styles.plansGalleryBody}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionLeft}>
          <h2 id="workspace-plans-title" className={styles.sectionTitle}>Planos</h2>
          <span className={styles.planCount}>{plans.length}</span>
        </div>
        {sectionControls}
      </div>

      {!hasVisiblePlans ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyStateIcon}><PlusIcon /></span>
          <p className={styles.emptyStateTitle}>Nenhum plano ainda</p>
          <p className={styles.emptyStateHint}>
            Crie seu primeiro plano para organizar o trabalho no quadro.
          </p>
          <div className={styles.emptyStateActions}>
            <button type="button" className={styles.emptyStateBtnPrimary} onClick={openNewPlan}>
              <PlusIcon />
              Novo plano
            </button>
          </div>
        </div>
      ) : (
        renderPlanCollection(plans, { includeNewPlanCard: view === 'grid' })
      )}
    </div>
  )

  return (
    <AppThemeScope>
      <ProductAppShell
        contentClassName={styles.main}
        contentTag="main"
      >
        <CustomScrollArea
          className={styles.mainScrollArea}
          viewportClassName={styles.mainScrollViewport}
          refreshKey={`workspace:${view}:${isLoading ? 'loading' : 'ready'}`}
        >
          <div className={styles.content}>
            {isBackendDriven && isLoading ? (
              <WorkspaceLoadingState />
            ) : (
              plansSectionContent
            )}
          </div>
        </CustomScrollArea>
      </ProductAppShell>

      {/* ════════════ NEW PLAN POPOVER ════════════ */}
      {newPlanAnchor && (
        <NewPlanPopover
          anchorEl={newPlanAnchor}
          onClose={() => setNewPlanAnchor(null)}
          onSubmit={handleNewPlan}
          isBackendDriven={isBackendDriven}
        />
      )}

      {backgroundPickerPlan && (
        <PlanBackgroundPicker
          plan={backgroundPickerPlan}
          anchorRect={backgroundPicker.anchorRect}
          busy={backgroundBusy}
          onClose={() => {
            if (!backgroundBusy) setBackgroundPicker(null)
          }}
          onSelectTheme={handlePlanBackgroundTheme}
          onSelectImage={handlePlanBackgroundImage}
        />
      )}

      {notification && (
        <div className={styles.notification} role="status" aria-live="polite">
          {notification}
        </div>
      )}
    </AppThemeScope>
  )
}
