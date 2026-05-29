export function buildMockIntelligenceReply(prompt) {
  const normalized = String(prompt ?? '').toLowerCase()
  if (normalized.includes('calend')) {
    return 'Posso organizar isso em blocos de foco. Comece mapeando reuniões fixas, separe 2 janelas para execução profunda e reserve um checkpoint curto no fim do dia.'
  }
  if (normalized.includes('pitch')) {
    return 'Uma boa base: problema, público, insight, solução, diferenciais, plano de execução e próximos passos. Se quiser, posso transformar isso em um roteiro slide a slide.'
  }
  if (normalized.includes('ui')) {
    return 'Vamos começar pelo essencial: tokens de cor e espaçamento, tipografia, botões, inputs, cards de conteúdo e estados de feedback. Depois conectamos isso aos fluxos principais.'
  }
  return 'Entendi. Eu começaria separando a ideia em objetivo, usuários, fluxo principal, riscos e primeiro entregável. Me diga qual parte você quer aprofundar e eu continuo a partir dela.'
}
