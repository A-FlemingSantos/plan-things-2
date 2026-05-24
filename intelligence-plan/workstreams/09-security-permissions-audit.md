# Frente 09: Seguranca, permissoes e auditoria

## Missao do agente

Implemente as garantias de seguranca do Intelligence. O backend deve decidir o que a IA pode ver, quais tools sao enviadas ao modelo, quais propostas podem ser criadas e quais acoes podem ser aplicadas.

Nao confie no prompt como mecanismo de seguranca. Prompt orienta o modelo; backend autoriza.

## Camadas de permissao

Toda model-facing tool e capability interna deve passar por:

```txt
1. Permissao do usuario no Plan Things.
2. Configuracao de AI tool no workspace/usuario.
3. Permissao do provedor externo, se houver.
4. Validacao de acesso no nivel da entidade.
```

Filtre tools antes de chamar OpenAI e valide novamente quando receber tool call.

## Configuracoes

Implemente separacao entre:

```txt
configuracao de model-facing tool
configuracao de capability interna
permissao de proposta
permissao de apply
```

Workspace define padrao. Usuario pode restringir mais. Usuario nao pode habilitar tool bloqueada pelo workspace.

Exemplo: o workspace pode permitir criar proposta de card, mas bloquear apply de convite para usuarios sem permissao administrativa.

## Confirmacao humana

Exija confirmacao para qualquer acao que:

- cria dados;
- edita dados;
- remove dados;
- convida pessoas;
- atribui pessoas;
- envia e-mail;
- anexa arquivos;
- vincula entidade externa;
- altera estado de workspace/plano/membro.

Confirmacao deve estar associada a proposta persistida, nao a texto solto. No apply, revalide permissao e estado atual.

## Auditoria

Registre eventos que permitam responder:

- quem solicitou;
- em qual workspace;
- qual conversa/mensagem;
- quais model-facing tools estavam habilitadas;
- qual tool o modelo chamou;
- para quais capabilities o backend roteou;
- qual proposal id foi criado;
- quem aprovou;
- quais entidades foram afetadas;
- quais provedores externos foram chamados;
- resultado/falha;
- timestamps.

## Segredos

- Chave OpenAI apenas no backend/secret manager.
- Private key e webhook secret do GitHub apenas no backend/secret manager.
- Nao registrar provider tokens em log.
- Nao retornar ids secretos de OpenAI/GitHub ao frontend.
- Evitar payload completo em log quando houver arquivo, email, token ou dados sensiveis.

## Multi-tenant

Regras obrigatorias:

- Sempre filtrar por `workspace_id`.
- Validar se plano/card/arquivo/membro pertence ao workspace.
- Revalidar permissao no apply.
- Selecionar vector stores apenas apos filtro local de permissao.
- Repos GitHub precisam estar habilitados no workspace e autorizados pela installation.

Ids vindos do modelo sao argumentos sugeridos. Carregue entidade pelo workspace antes de usar.

## Prompt injection

Conteudo de arquivos, commits, PRs e mensagens externas e dado nao confiavel. Ele nao pode sobrescrever:

- permissao;
- regra de apply;
- escopo de workspace;
- sigilo;
- prompt de sistema;
- configuracao de tools.

## Limites desta frente

- Nao implemente UX completa de configuracoes, salvo necessario para governanca minima.
- Nao implemente provider OAuth completo.
- Nao relaxe permissao para facilitar demo.

## Aceite

- Tools sao filtradas por permissao antes da chamada ao modelo.
- Tool calls recebidas tambem sao validadas.
- Apply revalida usuario, workspace, entidade e estado.
- Audit events cobrem tool calls e acoes aplicadas.
- Segredos nao chegam ao frontend nem aos logs.
- Testes cobrem contexto nao autorizado e apply negado.
