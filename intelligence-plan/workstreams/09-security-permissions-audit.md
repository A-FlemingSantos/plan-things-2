# Frente 09: Seguranca, permissoes e auditoria

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Garantir que Intelligence veja e faca apenas aquilo que o usuario atual tem permissao para ver e fazer.

## Camadas de permissao

Toda model-facing tool/capability deve passar por:

```txt
1. Permissao do usuario no Plan Things.
2. Configuracao de AI tool no workspace/usuario.
3. Permissao do provedor, se houver integracao externa.
4. Validacao de acesso no nivel da entidade.
```

Nao enviar tools nao autorizadas para OpenAI.

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

## Segredos

- Chaves OpenAI ficam apenas no backend.
- Private key/webhook secret do GitHub ficam apenas no backend.
- Nao registrar provider tokens em log.
- Nao retornar identificadores secretos de OpenAI ou GitHub ao frontend.

## Seguranca multi-tenant

- Sempre filtrar por `workspace_id`.
- Validar se ids de plano/cartao/arquivo/membro pertencem ao workspace.
- Revalidar permissao ao aplicar uma proposta, nao apenas ao cria-la.
- Vector stores de File Search devem ser selecionados apenas depois do filtro de permissao.
- Repositorios GitHub precisam estar habilitados no workspace e autorizados pela installation.

## Controles de risco

```txt
Modelo inventa objeto -> validar ids e usar context/entity tools.
Acao nao autorizada -> nao expor tool; revalidar no apply.
Vazamento de dados -> montar contexto server-side e filtrar por workspace.
Prompt injection de arquivos/GitHub -> tratar conteudo externo como contexto nao confiavel.
Proposta obsoleta -> expirar propostas e revalidar estado da entidade no apply.
```

## Definition of Done

- Disponibilidade de tools e filtrada por permissao.
- Aplicacao de proposta revalida todos os acessos.
- Audit events sao gravados para tool calls e acoes aplicadas.
- Segredos de provedores externos nao sao expostos.
- Testes cobrem contexto nao autorizado e apply nao autorizado.

