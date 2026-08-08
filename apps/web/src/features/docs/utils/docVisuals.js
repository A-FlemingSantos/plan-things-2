const DOC_COVER_GRADIENTS = [
  'linear-gradient(135deg, #c9b8a8 0%, #8a9bb0 48%, #5f6f82 100%)',
  'linear-gradient(145deg, #d7d2c8 0%, #9aa7b5 55%, #6d7886 100%)',
  'linear-gradient(140deg, #b8c4b0 0%, #7d8f9e 52%, #4f5d6b 100%)',
  'linear-gradient(150deg, #d4c5b5 0%, #a3b0bc 50%, #687888 100%)',
  'linear-gradient(130deg, #cfc0ae 0%, #96a3b3 46%, #5a6878 100%)',
  'linear-gradient(155deg, #ddd6cb 0%, #adb8c4 58%, #727f8f 100%)',
]

function hashString(value = '') {
  return [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0)
}

export function getDocumentCoverGradient(documentId) {
  if (!documentId) return DOC_COVER_GRADIENTS[0]
  return DOC_COVER_GRADIENTS[hashString(String(documentId)) % DOC_COVER_GRADIENTS.length]
}

export function formatDocumentMeta(updatedAt) {
  if (!updatedAt?.text) return ''
  return `Atualizado ${updatedAt.text.toLowerCase()}`
}
