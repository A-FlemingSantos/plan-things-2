import {
  Download,
  FileText,
  Monitor,
  Paperclip,
  X,
} from 'lucide-react'
import { formatFileSize } from '../../../../files/data/libraryRepository.js'

export function CardModalAttachmentAction({
  styles,
  iconSize,
  iconStroke,
  attachmentAddSplitRef,
  attachmentAddButtonRef,
  attachmentAddMenuRef,
  showAttachmentAddMenu,
  setShowAttachmentAddMenu,
  setFilePickerOpening,
  setShowFilePicker,
  uploadingLocalFile,
  openFilePicker,
  localFileInputRef,
}) {
  return (
    <div ref={attachmentAddSplitRef} className={styles.cmActionAttachWrap}>
      <button
        ref={attachmentAddButtonRef}
        type="button"
        className={styles.cmActionItem}
        aria-label="Adicionar anexo"
        aria-expanded={showAttachmentAddMenu}
        aria-haspopup="menu"
        onClick={() => {
          setFilePickerOpening(false)
          setShowFilePicker(false)
          setShowAttachmentAddMenu((value) => !value)
        }}
        disabled={uploadingLocalFile}
      >
        <span className={styles.cmActionItemIcon}><Paperclip size={iconSize} strokeWidth={iconStroke} aria-hidden="true" /></span>
        {uploadingLocalFile ? 'Enviando...' : 'Anexar arquivo'}
      </button>

      {showAttachmentAddMenu && (
        <div
          ref={attachmentAddMenuRef}
          className={styles.cmAttachmentAddMenu}
          role="menu"
        >
          <button
            type="button"
            className={styles.cmAttachmentAddMenuItem}
            onClick={() => {
              void openFilePicker({
                anchor: attachmentAddButtonRef?.current ?? attachmentAddSplitRef?.current,
              })
            }}
            role="menuitem"
          >
            <span className={styles.cmAttachmentAddMenuItemIcon}><FileText size={iconSize} strokeWidth={iconStroke} aria-hidden="true" /></span>
            Biblioteca
          </button>
          <button
            type="button"
            className={styles.cmAttachmentAddMenuItem}
            onClick={() => {
              setShowAttachmentAddMenu(false)
              localFileInputRef.current?.click()
            }}
            role="menuitem"
          >
            <span className={styles.cmAttachmentAddMenuItemIcon}><Monitor size={14} strokeWidth={iconStroke} aria-hidden="true" /></span>
            Meu Computador
          </button>
        </div>
      )}
    </div>
  )
}

export function CardModalInlineAttachments({
  styles,
  iconSize,
  iconStroke,
  attachments,
  localFileInputRef,
  handleLocalFileInput,
  handleRemoveAttachment,
  removingAttachmentId,
  onDownloadFile,
  onAttachmentDownloadError,
}) {
  return (
    <>
      <input
        ref={localFileInputRef}
        type="file"
        className={styles.cmHiddenFileInput}
        onChange={handleLocalFileInput}
        tabIndex={-1}
        aria-hidden="true"
      />

      {attachments.length > 0 && (
        <div className={styles.cmInlineAttachments}>
          {attachments.map((attachment) => (
            <div key={attachment.id} className={styles.cmInlineAttachmentRow}>
              <span className={styles.cmInlineAttachmentIcon}><FileText size={iconSize} strokeWidth={iconStroke} aria-hidden="true" /></span>
              <div className={styles.cmInlineAttachmentBody}>
                <span className={styles.cmInlineAttachmentName}>{attachment.name}</span>
                <span className={styles.cmInlineAttachmentMeta}>
                  {formatFileSize(attachment.size)}
                  {attachment.attachedBy?.fullName ? ` · ${attachment.attachedBy.fullName}` : ''}
                </span>
              </div>
              <div className={styles.cmInlineAttachmentActions}>
                {onDownloadFile ? (
                  <button
                    type="button"
                    className={styles.cmInlineAttachmentBtn}
                    onClick={() => {
                      Promise.resolve(onDownloadFile(attachment)).catch(onAttachmentDownloadError)
                    }}
                    aria-label={`Baixar ${attachment.name}`}
                  >
                    <Download size={14} strokeWidth={iconStroke} aria-hidden="true" />
                  </button>
                ) : null}
                {attachment.canRemove ? (
                  <button
                    type="button"
                    className={styles.cmInlineAttachmentBtn}
                    onClick={() => handleRemoveAttachment(attachment)}
                    disabled={removingAttachmentId === attachment.id}
                    aria-label={`Remover ${attachment.name}`}
                  >
                    <X size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
