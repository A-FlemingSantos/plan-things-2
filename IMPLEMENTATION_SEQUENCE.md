# Sequencia Recomendada de Implementacoes

## 1. Fechar convites de plano na UI

- Listar convites do plano.
- Revogar convite direto na interface.
- Mostrar convites pendentes do usuario de forma clara.
- Melhorar o fluxo de recusa de convite.

Por que primeiro:
- e o fluxo mais visivel para o usuario
- ja ha backend suficiente para isso
- isso transforma a colaboracao em algo realmente usavel

## 2. Criar a base real de integracao Gmail/Outlook

- Preparar OAuth/conector real.
- Definir como as contas serao vinculadas.
- Resolver permissao e consentimento para envio.
- Estruturar a operacao de envio como um fluxo autenticado do usuario.

Por que antes do e-mail automatico:
- sem essa camada, o envio automatico ficaria desalinhado com a regra de produto
- o sistema nao deve se comportar como SMTP generico

## 3. Implementar e-mail automatico

- Disparar e-mails de convite pela integracao real.
- Definir retry, falha e feedback de envio.
- Amarrar o fluxo ao estado do convite.

Por que depois:
- depende da base de Gmail/Outlook
- evita uma implementacao provisoria que depois precise ser refeita

## 4. Melhorar governanca de colaboracao

- Registrar auditoria de acoes importantes.
- Rastrear quem convidou, aceitou, anexou, removeu e descompartilhou.
- Preparar notificacoes baseadas em eventos reais.

Por que aqui:
- so faz sentido quando os eventos ja estiverem bem definidos
- aumenta confianca e clareza sem mexer no fluxo principal

## 5. Refinar arquivos e anexos

- Adicionar busca.
- Adicionar paginação.
- Adicionar ordenacao.
- Melhorar indicacao de origem e permissao.

Por que depois:
- a base funcional ja existe
- agora o ganho e produtividade e escala de uso

## 6. Limpar redundancias de settings

- Simplificar `homePage`, `openLastCtx` e a "Tela inicial do workspace".
- Persistir `density` globalmente.
- Ajustar a experiencia de entrada no app para ficar menos confusa.

Por que nessa fase:
- e consolidacao de produto
- melhora previsibilidade sem criar dependencia externa

## 7. Avancar em integracoes e seguranca

- OAuth real para calendarios e e-mail.
- Sync real com providers.
- Avatar.
- 2FA.
- Sessoes reais.
- Exportacao e exclusao de dados.

Por que por ultimo:
- sao itens mais caros e mais dependentes da maturidade da plataforma
- fazem mais sentido depois do nucleo colaborativo estar redondo

## Resumo curto

1. Fechar convites
2. Preparar Gmail/Outlook
3. Fazer e-mail automatico
4. Adicionar governanca
5. Melhorar arquivos
6. Consolidar settings
7. Evoluir integracoes e seguranca

