import { apiRequest } from '../../../shared/api/apiClient.js'
import { partitionComposerChips } from '../../../shared/components/ComposerAttachmentStrip/composerAttachmentUtils.js'

function findSourceFileForAttachment(chips, attachment) {
  const { attachments } = partitionComposerChips(chips)
  const match = attachments.find((chip) => chip.id === attachment.id || chip.type === attachment.type)
  return match?.sourceFile instanceof File ? match.sourceFile : null
}

async function uploadFile(file, token) {
  const formData = new FormData()
  formData.append('file', file)

  const uploaded = await apiRequest('/api/files/upload', {
    method: 'POST',
    token,
    body: formData,
  })

  return String(uploaded?.id ?? '')
}

/**
 * Uploads local composer files and returns a snapshot ready for the API.
 * @param {import('../../../shared/contracts/intelligenceContracts.js').ContextSnapshot} snapshot
 * @param {Array} chips
 * @param {{ token?: string|null }} [options]
 */
export async function uploadComposerAttachments(snapshot, chips, { token } = {}) {
  if (!token || !snapshot) {
    return snapshot
  }

  const uploadAttachment = async (attachment) => {
    if (attachment.fileId || attachment.isMock) {
      return attachment
    }

    const sourceFile = findSourceFileForAttachment(chips, attachment)
    if (!(sourceFile instanceof File)) {
      return attachment
    }

    const fileId = await uploadFile(sourceFile, token)
    if (!fileId) {
      return attachment
    }

    return {
      ...attachment,
      fileId,
      previewUrl: null,
    }
  }

  const imageAttachments = await Promise.all(
    (snapshot.imageAttachments ?? []).map(uploadAttachment),
  )
  const fileAttachments = await Promise.all(
    (snapshot.fileAttachments ?? []).map(uploadAttachment),
  )

  return {
    ...snapshot,
    imageAttachments,
    fileAttachments,
  }
}
