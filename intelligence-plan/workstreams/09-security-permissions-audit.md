# Frente 09: Seguranca, permissoes e auditoria

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Garantir que Intelligence veja e faca apenas aquilo que o usuario atual tem permissao para ver e fazer.

A intencao desta frente e tornar seguranca uma propriedade do backend, nao uma promessa do prompt. O modelo pode sugerir, mas nao autoriza nada. Toda leitura, proposta e aplicacao precisa passar por permissoes reais do Plan Things, configuracoes de tools e permissoes do provedor externo quando houver.

## Camadas de permissao

Toda model-facing tool/capability deve passar por:

```txt
1. Permissao do usuario no Plan Things.
2. Configuracao de AI tool no workspace/usuario.
3. Permissao do provedor, se houver integracao externa.
4. Validacao de acesso no nivel da entidade.
```

Nao enviar tools nao autorizadas para OpenAI.

Filtrar tools antes da chamada ao modelo reduz risco e tokens, mas nao basta. O backend tambem deve validar cada tool call recebida, porque o modelo pode tentar chamar uma tool com ids fora de escopo ou argumentos inconsistentes.

## Configuracoes de tools

Workspace define padroes. Usuario pode restringir mais. Usuario nao pode habilitar uma tool bloqueada pelo workspace.

Distinguir:

```txt
configuracao de model-facing tool
configuracao de capability interna
permissao de proposta
permissao de apply
```

Capability de escrita/apply deve ser governavel separadamente da capability de proposta.

Exemplo: um workspace pode permitir `action.propose` para criar propostas de card, mas bloquear apply de convite de membro para usuarios sem permissao administrativa. A UI deve refletir isso, mas a decisao final fica no backend.

## Regras de confirmacao

Exigir confirmacao explicita do usuario para qualquer coisa que:

- cria dados;
- edita dados;
- remove dados;
- convida pessoas;
- atribui pessoas;
- envia e-mail;
- anexa arquivos;
- vincula entidades externas;
- altera estado de workspace/plano/membro.

O modelo nao deve aplicar mudancas diretamente no MVP.

Confirmacao precisa ser associada a uma proposta persistida, nao a um texto solto na conversa. No apply, o backend deve revalidar estado atual e permissao atual, porque algo pode ter mudado desde a proposta.

## Audit events

Auditoria deve registrar:

- usuario solicitante;
- workspace;
- conversa/mensagem;
- model-facing tools habilitadas;
- tool chamada;
- capabilities roteadas;
- proposal id;
- aprovado por;
- entidades afetadas;
- chamadas a provedores;
- resultado/falha;
- timestamps.

Auditoria deve permitir responder: "qual usuario pediu?", "que contexto foi usado?", "qual tool o modelo chamou?", "para quais capabilities o backend roteou?", "quem aprovou?" e "qual entidade mudou?".

## Segredos

- Chaves OpenAI ficam apenas no backend.
- Private key/webhook secret do GitHub ficam apenas no backend.
- Nao registrar provider tokens em log.
- Nao retornar identificadores secretos de OpenAI ou GitHub ao frontend.

Logs podem registrar ids internos de conversa/proposta/tool call, mas devem evitar payloads completos quando houver arquivo, email, token, conteudo sensivel ou dados de terceiros.

## Seguranca multi-tenant

- Sempre filtrar por `workspace_id`.
- Validar se ids de plano/cartao/arquivo/membro pertencem ao workspace.
- Revalidar permissao ao aplicar uma proposta, nao apenas ao cria-la.
- Vector stores de File Search devem ser selecionados apenas depois do filtro de permissao.
- Repositorios GitHub precisam estar habilitados no workspace e autorizados pela installation.

Ids vindos do modelo sao apenas sugestoes de argumento. Antes de usar qualquer id, o backend deve carregar a entidade pelo workspace e confirmar acesso do usuario.

## Controles de risco

```txt
Modelo inventa objeto -> validar ids e usar context/entity tools.
Acao nao autorizada -> nao expor tool; revalidar no apply.
Vazamento de dados -> montar contexto server-side e filtrar por workspace.
Prompt injection de arquivos/GitHub -> tratar conteudo externo como contexto nao confiavel.
Proposta obsoleta -> expirar propostas e revalidar estado da entidade no apply.
```

Conteudo vindo de arquivos, commits, PRs e mensagens externas deve ser tratado como dados, nao instrucoes. O prompt do sistema deve deixar claro que contexto externo nao pode sobrescrever regras de permissao, apply ou sigilo.

## Definition of Done

- Disponibilidade de tools e filtrada por permissao.
- Aplicacao de proposta revalida todos os acessos.
- Audit events sao gravados para tool calls e acoes aplicadas.
- Segredos de provedores externos nao sao expostos.
- Testes cobrem contexto nao autorizado e apply nao autorizado.
