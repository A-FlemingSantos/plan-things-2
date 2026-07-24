import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { WorkspaceIconGlyph } from '../../../../shared/components/WorkspaceIconBadge/WorkspaceIconBadge.jsx'
import { readRecentPlanIds } from '../../data/recentPlansStorage.js'
import { apiRequest, triggerBlobDownload } from '../../../../shared/api/apiClient.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import { DEFAULT_LOCAL_PREFERENCES, usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import {
  resolveKanbanAccentColor,
  resolveKanbanAccentForeground,
} from '../../data/kanbanColorPalette.js'
import { usePlans } from '../../context/PlansContext.jsx'
import { useTransientNotification } from '../../../../shared/hooks/useTransientNotification.js'
import NewPlanPopover from '../../components/NewPlanPopover/NewPlanPopover.jsx'
import PlanBackgroundPicker from '../../components/PlanBackgroundPicker/PlanBackgroundPicker.jsx'
import PlanCard from '../../components/PlanCard/PlanCard.jsx'
import WorkspaceIntelligenceSection from '../../components/WorkspaceIntelligenceSection/WorkspaceIntelligenceSection.jsx'
import WorkspaceLoadingState from '../../components/WorkspaceLoadingState/WorkspaceLoadingState.jsx'
import WorkspaceSectionActions from '../../components/WorkspaceSectionActions/WorkspaceSectionActions.jsx'
import {
  GridIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from '../../components/WorkspaceIcons/WorkspaceIcons.jsx'
import { uploadPlanCoverFile } from '../../components/workspaceCover/workspaceCoverUtils.js'
import styles from './Workspace.module.css'

export default function Workspace() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { accessToken, currentUser: authUser, workspace } = useAuth()
  const [view,         setView]         = useState('grid')
  const [search,       setSearch]       = useState('')
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
  const { plans, activePlan, activePlanId, createPlan, deletePlan, renamePlan, updatePlanCover, selectPlan, currentUser, isBackendDriven, isLoading } = usePlans()
  const { localPreferences } = usePreferences()
  const confirmDestructiveActions = localPreferences.confirmDestructiveActions ?? true
  const showIntelligenceSection = localPreferences.showIntelligenceSection ?? DEFAULT_LOCAL_PREFERENCES.showIntelligenceSection
  const intelligenceAccentStyle = {
    '--intelligence-theme-accent': resolveKanbanAccentColor(localPreferences?.kanbanAccentColor),
    '--intelligence-theme-accent-foreground': resolveKanbanAccentForeground(localPreferences?.kanbanAccentColor),
  }
  const userFirstName = currentUser?.fullName?.split(' ')[0] ?? 'Arthur'
  const userId = authUser?.id ?? currentUser?.id ?? null
  const [recentPlanIds, setRecentPlanIds] = useState(() => readRecentPlanIds(userId))

  useEffect(() => {
    setRecentPlanIds(readRecentPlanIds(userId))
  }, [userId, activePlanId])

  const matchesSearch = (plan) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return (
      plan.name.toLowerCase().includes(query)
      || plan.tag.toLowerCase().includes(query)
    )
  }

  const filtered = plans.filter(matchesSearch)
  const plansById = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans])
  const recentPlans = useMemo(
    () => recentPlanIds
      .map((planId) => plansById.get(planId))
      .filter(Boolean)
      .filter(matchesSearch),
    [plansById, recentPlanIds, search],
  )
  const workspaceGroups = useMemo(() => ([
    {
      id: workspace?.id ?? 'current-workspace',
      name: workspace?.name?.trim() || 'Área de trabalho pessoal',
      iconKey: workspace?.iconKey,
      plans: filtered,
    },
  ]), [filtered, workspace?.iconKey, workspace?.id, workspace?.name])
  const hasVisiblePlans = recentPlans.length > 0 || workspaceGroups.some((group) => group.plans.length > 0)
  const backgroundPickerPlan = backgroundPicker?.planId
    ? plans.find((plan) => plan.id === backgroundPicker.planId) ?? null
    : null
  const fileIdFromUrl = String(searchParams.get('file') ?? '').trim()

  const clearSearch = (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    setSearch('')
  }

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

  const openBoard = (planId) => {
    setBackgroundPicker(null)
    selectPlan(planId)
    navigate(buildWorkspaceBoardPath(planId))
  }

  const openNewPlan = (event) => {
    setNewPlanAnchor(event.currentTarget)
  }

  const renderPlanCard = (plan, cardView = view) => (
    <PlanCard
      key={plan.id}
      plan={plan}
      view={cardView}
      onOpen={() => openBoard(plan.id)}
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
      <label className={styles.searchWrap}>
        <span className={styles.searchIcon} aria-hidden="true"><SearchIcon /></span>
        <input
          className={styles.searchInput}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar planos..."
        />
        {search ? (
          <button
            type="button"
            className={styles.searchClear}
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearSearch}
            aria-label="Limpar busca de planos"
          >
            <XIcon />
          </button>
        ) : null}
      </label>
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

  const renderSectionHeader = (titleId, title, count, { withControls = false } = {}) => (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionLeft}>
        <h2 id={titleId} className={styles.sectionTitle}>{title}</h2>
        <span className={styles.planCount}>{count}</span>
      </div>
      {withControls ? sectionControls : null}
    </div>
  )

  const renderWorkspacesSectionHeader = (withControls = false) => (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionLeft}>
        <h2 id="workspace-workspaces-title" className={styles.sectionTitle}>Workspaces</h2>
        <span className={styles.planCount}>{workspaceGroups.length}</span>
      </div>
      <div className={styles.sectionHeaderRight}>
        <WorkspaceSectionActions />
        {withControls ? sectionControls : null}
      </div>
    </div>
  )

  const plansSectionContent = (
    <>
      {!hasVisiblePlans ? (
        <div className={styles.plansGalleryBody}>
          {renderWorkspacesSectionHeader(true)}
          <div className={styles.emptyState}>
              <span className={styles.emptyStateIcon}><SearchIcon /></span>
              <p className={styles.emptyStateTitle}>Nenhum plano encontrado</p>
              <p className={styles.emptyStateHint}>
                {search
                  ? `Tente outro termo ou limpe "${search}" para ver tudo.`
                  : 'Crie seu primeiro plano para organizar o trabalho no quadro.'}
              </p>
              <div className={styles.emptyStateActions}>
                {search && (
                  <button type="button" className={styles.emptyStateBtn} onClick={clearSearch}>
                    Limpar busca
                  </button>
                )}
                <button type="button" className={styles.emptyStateBtnPrimary} onClick={openNewPlan}>
                  <PlusIcon />
                  Novo plano
                </button>
              </div>
            </div>
        </div>
      ) : (
        <div className={styles.plansGalleryBody}>
          {recentPlans.length > 0 ? (
            <section className={styles.recentSection} aria-labelledby="workspace-recent-title">
              {renderSectionHeader('workspace-recent-title', 'Recentes', recentPlans.length, { withControls: true })}
              {renderPlanCollection(recentPlans, {
                gridClassName: `${styles.grid} ${styles.recentGrid}`,
              })}
            </section>
          ) : null}

          <section className={styles.workspacesSection} aria-labelledby="workspace-workspaces-title">
            {renderWorkspacesSectionHeader(recentPlans.length === 0)}

            <div className={styles.workspaceGroups}>
              {workspaceGroups.map((group) => (
                <div key={group.id} className={styles.workspaceGroup}>
                  <div className={styles.workspaceGroupHeader}>
                    <span className={styles.workspaceGroupIcon} aria-hidden="true">
                      <WorkspaceIconGlyph iconKey={group.iconKey} className={styles.workspaceGroupIconGlyph} />
                    </span>
                    <h3 className={styles.workspaceGroupTitle}>{group.name}</h3>
                    <span className={styles.planCount}>{group.plans.length}</span>
                  </div>
                  {group.plans.length === 0 ? (
                    <p className={styles.workspaceGroupEmpty}>
                      {search ? 'Nenhum plano corresponde à busca neste workspace.' : 'Nenhum plano neste workspace ainda.'}
                    </p>
                  ) : (
                    renderPlanCollection(group.plans, { includeNewPlanCard: view === 'grid' })
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
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
          refreshKey={`workspace:${view}:${showIntelligenceSection ? 'intelligence' : 'plans'}:${isLoading ? 'loading' : 'ready'}`}
        >
          <div className={`${styles.content} ${showIntelligenceSection ? styles.contentFramed : ''}`}>
            {isBackendDriven && isLoading ? (
              showIntelligenceSection ? (
                <section className={styles.plansGalleryPanel} aria-label="Carregando planos do workspace">
                  <WorkspaceLoadingState view={view} />
                </section>
              ) : (
                <WorkspaceLoadingState view={view} />
              )
            ) : (
              <>
                {showIntelligenceSection ? (
                  <WorkspaceIntelligenceSection
                    firstName={userFirstName}
                    accentStyle={intelligenceAccentStyle}
                  />
                ) : null}

                {showIntelligenceSection ? (
                  <section className={styles.plansGalleryPanel} aria-labelledby="workspace-workspaces-title">
                    {plansSectionContent}
                  </section>
                ) : (
                  plansSectionContent
                )}
              </>
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
