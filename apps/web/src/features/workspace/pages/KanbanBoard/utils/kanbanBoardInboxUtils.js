export function describeInboxError(error) {
  const messageByCode = {
    CARTAO_SEM_DESTINATARIOS: 'Escolha ao menos um membro para receber este cartão por e-mail.',
    DESTINATARIO_INVALIDO: 'Todos os destinatários precisam fazer parte deste plano.',
    GMAIL_NAO_CONECTADO: 'Gmail não conectado para este usuário. Conecte o Gmail em Configurações e tente novamente.',
    GMAIL_SCOPE_AUSENTE: 'A conexão Gmail não tem permissão de envio. Reconecte o Gmail em Configurações.',
    GMAIL_TOKEN_REFRESH_FALHOU: 'Não foi possível renovar a autorização Gmail. Reconecte o Gmail em Configurações.',
    GMAIL_ENVIO_CONVITE_FALHOU: 'O Gmail recusou o envio do e-mail. Verifique a conta conectada e tente novamente.',
    GMAIL_API_NAO_HABILITADA: 'A API do Gmail não está habilitada no projeto Google Cloud. Habilite Gmail API e tente novamente.',
  }

  if (!messageByCode[error?.code]) {
    return error?.message ?? 'Não foi possível enviar o cartão por e-mail.'
  }

  return `${messageByCode[error.code]} Código: ${error.code}.`
}
