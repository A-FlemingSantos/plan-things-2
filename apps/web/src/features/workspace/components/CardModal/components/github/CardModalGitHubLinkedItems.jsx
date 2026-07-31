import CardModalGitHubLinkItem from './components/CardModalGitHubLinkItem.jsx'

/**
 * @typedef {import('./githubPanelTypes.js').GitHubLinkedItem} GitHubLinkedItem
 */

/**
 * Shared linked-item list used by the GitHub sidebar panel and the main
 * CardModal body preview.
 *
 * @param {{
 *   styles: Record<string, string>,
 *   linkedItems?: GitHubLinkedItem[],
 *   isManager?: boolean,
 *   onUnlinkItem?: (item: GitHubLinkedItem) => void,
 *   pendingUnlinkItemIds?: string[],
 *   showSectionLabel?: boolean,
 *   sectionLabel?: string,
 *   showEmptyMessage?: boolean,
 * }} props
 */
export default function CardModalGitHubLinkedItems({
  styles,
  linkedItems = [],
  isManager = false,
  onUnlinkItem,
  pendingUnlinkItemIds = [],
  showSectionLabel = false,
  sectionLabel = 'Vinculados a este cartão',
  showEmptyMessage = true,
}) {
  if (!showEmptyMessage && linkedItems.length === 0) {
    return null
  }

  const listContent = linkedItems.length === 0 ? (
    showEmptyMessage ? (
      <p className={styles.linkedEmpty}>Nenhum item do GitHub vinculado a este cartão ainda.</p>
    ) : null
  ) : (
    <div className={styles.linkedList}>
      {linkedItems.map((item) => (
        <CardModalGitHubLinkItem
          key={item.id}
          styles={styles}
          item={item}
          variant="linked"
          canManage={isManager}
          onUnlinkItem={onUnlinkItem}
          isUnlinking={pendingUnlinkItemIds.includes(item.id)}
        />
      ))}
    </div>
  )

  const body = showSectionLabel ? (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>{sectionLabel}</p>
      {listContent}
    </div>
  ) : listContent

  return (
    <div className={styles.themeScope}>
      {body}
    </div>
  )
}
