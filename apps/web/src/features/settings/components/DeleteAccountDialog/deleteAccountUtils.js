export const DELETE_CONFIRMATION_PHRASE = 'EXCLUIR MINHA CONTA'

export function isDeletePhraseValid(value) {
  return value.trim() === DELETE_CONFIRMATION_PHRASE
}
