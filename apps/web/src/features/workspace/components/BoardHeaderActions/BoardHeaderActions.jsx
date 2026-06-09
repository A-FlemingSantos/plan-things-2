import MemberAvatarStack from '../../../../shared/components/MemberAvatarStack/MemberAvatarStack.jsx'

export default function BoardHeaderActions({
  members,
  icons,
  styles,
  onOpenMembers,
  membersButtonRef,
  membersLoading = false,
  membersPlaceholderCount = 0,
  onAutomate,
  onFilter,
  onFavorite,
  onShare,
}) {
  return (
    <div className={styles.boardHeaderActions}>
      <MemberAvatarStack
        members={members}
        className={styles.boardHeaderMembersStack}
        size="compact"
        isLoading={membersLoading}
        placeholderCount={membersPlaceholderCount}
      />

      <div className={styles.boardHeaderActionCluster}>
        <button type="button" className={styles.boardHeaderCompactIconButton} onClick={onAutomate} aria-label="Integrações">
          <icons.Bolt />
        </button>
        <button type="button" className={styles.boardHeaderCompactIconButton} onClick={onFavorite} aria-label="Favoritar plano">
          <icons.Star />
        </button>
        <button
          ref={membersButtonRef}
          type="button"
          className={styles.boardHeaderCompactIconButton}
          onClick={onOpenMembers}
          aria-label="Membros do plano"
        >
          <icons.Users />
        </button>
      </div>

      <button type="button" className={styles.boardHeaderShareButton} onClick={onShare}>
        <span className={styles.boardHeaderShareIcon} aria-hidden="true">
          <icons.UserPlus />
        </span>
        <span className={styles.boardHeaderShareLabel}>Compartilhar</span>
      </button>

      <button type="button" className={styles.boardHeaderCompactIconButton} onClick={onFilter} aria-label="Configurações do quadro">
        <icons.More />
      </button>
    </div>
  )
}
