import {
  ChevronRight,
  Download,
  FileText,
  Folder,
  Funnel,
  Library,
  List,
  Paperclip,
  Search,
} from 'lucide-react'
import { formatFileSize } from '../../../../files/data/libraryRepository.js'
import { FILE_TYPE_OPTIONS, getFileCategory } from '../utils/attachmentUtils.js'

export default function CardModalFilePicker({
  styles,
  iconSize,
  iconStroke,
  showFilePicker,
  filePickerRef,
  filePickerPosition,
  planFiles,
  libraryFiles,
  filePickerFilter,
  setFilePickerFilter,
  filePickerTypeButtonRef,
  showFilePickerTypeMenu,
  setShowFilePickerTypeMenu,
  activeFileTypeLabel,
  filePickerTypeMenuRef,
  filePickerTypeFilter,
  setFilePickerTypeFilter,
  fileSearch,
  setFileSearch,
  fileActionError,
  filesError,
  isFilePickerLoading,
  pickerFiles,
  attachedFileIds,
  attachingFileId,
  onDownloadFile,
  handleDownloadError,
  handleAttachFile,
}) {
  if (!showFilePicker) return null

  return (
    <div
      ref={filePickerRef}
      className={styles.cmFilePicker}
      style={{ top: `${filePickerPosition.top}px`, left: `${filePickerPosition.left}px` }}
      role="dialog"
      aria-label="Anexar arquivo"
      onClick={e => e.stopPropagation()}
    >
      <div className={styles.cmFilePickerControls}>
        <div className={styles.cmFilePickerTopRow}>
          <div className={styles.cmFilePickerTabs} role="tablist" aria-label="Fonte do arquivo">
            {[
              { id: 'plan', label: 'Plano', count: planFiles.length },
              { id: 'library', label: 'Biblioteca', count: libraryFiles.length },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.cmFilePickerTab} ${filePickerFilter === option.id ? styles.cmFilePickerTabActive : ''}`}
                onClick={() => {
                  setFilePickerFilter(option.id)
                  setShowFilePickerTypeMenu(false)
                }}
                role="tab"
                aria-selected={filePickerFilter === option.id}
              >
                <span className={styles.cmFilePickerTabIcon}>
                  {option.id === 'plan' ? <Folder size={iconSize} strokeWidth={iconStroke} aria-hidden="true" /> : <Library size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />}
                </span>
                <span className={styles.cmFilePickerTabLabel}>{option.label}</span>
                <span className={styles.cmFilePickerTabCount}>{option.count}</span>
              </button>
            ))}
          </div>
          <div className={styles.cmFilePickerToolbarRow}>
            <button
              ref={filePickerTypeButtonRef}
              type="button"
              className={`${styles.cmFilePickerFilterBtn} ${showFilePickerTypeMenu ? styles.cmFilePickerFilterBtnActive : ''}`}
              onClick={() => setShowFilePickerTypeMenu((current) => !current)}
              aria-haspopup="menu"
              aria-expanded={showFilePickerTypeMenu}
            >
              <Funnel size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
              <span>{activeFileTypeLabel}</span>
              <span className={styles.cmFilePickerFilterBtnChevron}><ChevronRight size={11} strokeWidth={iconStroke} aria-hidden="true" /></span>
            </button>

            {showFilePickerTypeMenu && (
              <div ref={filePickerTypeMenuRef} className={styles.cmFilePickerTypeMenu} role="menu">
                {FILE_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.cmFilePickerTypeMenuItem} ${filePickerTypeFilter === option.id ? styles.cmFilePickerTypeMenuItemActive : ''}`}
                    onClick={() => {
                      setFilePickerTypeFilter(option.id)
                      setShowFilePickerTypeMenu(false)
                    }}
                    role="menuitemradio"
                    aria-checked={filePickerTypeFilter === option.id}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.cmFilePickerSearchRow}>
          <label className={styles.cmFilePickerSearchField}>
            <span className={styles.cmFilePickerSearchIcon}><Search size={iconSize} strokeWidth={iconStroke} aria-hidden="true" /></span>
            <input
              type="search"
              className={styles.cmFilePickerSearch}
              value={fileSearch}
              onChange={e => setFileSearch(e.target.value)}
              placeholder="Buscar arquivo..."
              aria-label="Buscar arquivo"
            />
          </label>
          <button type="button" className={styles.cmFilePickerViewBtn} aria-label="Lista">
            <List size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
          </button>
        </div>
      </div>

      {fileActionError ? <p className={styles.cmFilePickerError}>{fileActionError}</p> : null}
      {filesError ? <p className={styles.cmFilePickerError}>{filesError}</p> : null}

      <div className={styles.cmFilePickerList}>
        {isFilePickerLoading ? (
          Array.from({ length: 5 }, (_, index) => (
            <div key={`picker-loading-${index}`} className={styles.cmFilePickerSkeleton} />
          ))
        ) : pickerFiles.length ? (
          pickerFiles.map((file) => {
            const isAttached = attachedFileIds.has(file.id)
            const isBusy = attachingFileId === file.id
            const fileCategory = getFileCategory(file)

            return (
              <div
                key={file.id}
                className={styles.cmFilePickerItem}
              >
                <span className={styles.cmFilePickerIcon}><FileText size={iconSize} strokeWidth={iconStroke} aria-hidden="true" /></span>
                <span className={styles.cmFilePickerBody}>
                  <span className={styles.cmFilePickerName}>{file.name}</span>
                  <span className={styles.cmFilePickerMeta}>{formatFileSize(file.size)} · {file.modified}</span>
                  <span className={`${styles.cmFilePickerBadge} ${styles[`cmFilePickerBadge${fileCategory.id.charAt(0).toUpperCase()}${fileCategory.id.slice(1)}`] ?? ''}`}>
                    {fileCategory.label}
                  </span>
                </span>
                <span className={styles.cmFilePickerItemActions}>
                  {onDownloadFile ? (
                    <button
                      type="button"
                      className={styles.cmFilePickerMoreBtn}
                      onClick={() => {
                        Promise.resolve(onDownloadFile(file)).catch(handleDownloadError)
                      }}
                      aria-label={`Baixar ${file.name}`}
                    >
                      <Download size={14} strokeWidth={iconStroke} aria-hidden="true" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={`${styles.cmFilePickerAttachBtn} ${isAttached ? styles.cmFilePickerAttachBtnDisabled : ''}`}
                    onClick={() => handleAttachFile(file)}
                    disabled={isAttached || isBusy}
                  >
                    <Paperclip size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
                    {isAttached ? 'Anexado' : isBusy ? 'Anexando...' : 'Anexar'}
                  </button>
                </span>
              </div>
            )
          })
        ) : (
          <div className={styles.cmFilePickerEmpty}>
            <FileText size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
            <strong>Nada para mostrar</strong>
            <p>{filePickerFilter === 'plan' ? 'Nenhum arquivo compartilhado com este plano.' : 'Nenhum arquivo disponível na sua biblioteca.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
