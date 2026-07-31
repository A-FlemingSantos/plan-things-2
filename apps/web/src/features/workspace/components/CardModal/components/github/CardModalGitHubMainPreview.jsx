import CardModalGitHubLinkedItems from './CardModalGitHubLinkedItems.jsx'
import githubStyles from './CardModalGitHubPanel.module.css'

/**
 * @typedef {import('./githubPanelTypes.js').GitHubLinkedItem} GitHubLinkedItem
 */

/**
 * Main-column preview of GitHub items linked to the card. Reuses the same
 * linked-item blocks as the GitHub sidebar, without the Recentes panel chrome.
 *
 * @param {{
 *   styles: Record<string, string>,
 *   cardId: string,
 *   isActivitySidebarOpen: boolean,
 *   githubIntegration?: {
 *     status?: string,
 *     linkedItems?: GitHubLinkedItem[],
 *     isManager?: boolean,
 *     onUnlinkItem?: (item: GitHubLinkedItem) => void,
 *     pendingUnlinkItemIds?: string[],
 *   } | null,
 * }} props
 */
export default function CardModalGitHubMainPreview({
  styles,
  cardId,
  isActivitySidebarOpen,
  githubIntegration = null,
}) {
  if (isActivitySidebarOpen || !githubIntegration) {
    return null
  }

  const {
    status = 'loading',
    linkedItems = [],
    isManager = false,
    onUnlinkItem,
    pendingUnlinkItemIds = [],
  } = githubIntegration

  if (status !== 'ready' || linkedItems.length === 0) {
    return null
  }

  return (
    <section
      className={styles.cmGitHubPreview}
      aria-label="GitHub"
      data-card-id={cardId}
    >
      <CardModalGitHubLinkedItems
        styles={githubStyles}
        linkedItems={linkedItems}
        isManager={isManager}
        onUnlinkItem={onUnlinkItem}
        pendingUnlinkItemIds={pendingUnlinkItemIds}
        showEmptyMessage={false}
      />
    </section>
  )
}
