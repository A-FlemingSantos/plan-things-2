# Auditoria da integracao mobile + backend

Data da auditoria: 2026-05-01

## Escopo

Esta auditoria usou `TEMP_MOBILE_BACKEND_INTEGRATION_REVIEW.md` como guia para revisar a base de codigo nos fluxos de autenticacao, OAuth, Gmail, navegacao mobile, providers mobile, pacote compartilhado, endpoints backend e compatibilidade web.

O objetivo nao foi validar o documento temporario contra o codigo, e sim procurar erros, inconsistencias e pontos ainda pouco polidos no codigo atual.

## Validacoes executadas

- `mvn -DskipTests compile` em `services/api`: passou.
- `npm --workspace apps/web run build`: passou, com aviso existente de chunk JS acima de 500 kB.
- `npm --workspace apps/mobile exec -- expo export --platform web --output-dir dist-audit`: passou.
- Artefatos temporarios de build/export foram removidos apos a validacao.

## Estado atual do projeto

O projeto esta em bom estado de compilacao/exportacao para a integracao recente: backend compila, web builda e o mobile exporta para web. Os contratos principais de endpoints usados pelos providers mobile batem com os controllers Spring para planos, board, arquivos, settings, OAuth e Gmail.

Tambem foi confirmado que o pacote `packages/shared-client` nao depende de APIs browser-only como `window`, `document`, `import.meta` ou anchors de download. Os imports de `demoSession`/`demoData` nao aparecem no fluxo principal de Auth/Home/Board/Files/Settings; o dado demo remanescente esta isolado em `InboxScreen`, que esta fora da navegacao principal.

Ainda assim, ha problemas funcionais importantes em fluxos mobile: callbacks de erro OAuth/Gmail podem voltar para a URL web, checklist/data/anexos do board tem lacunas de persistencia, algumas acoes visuais prometem comportamento sem endpoint real, e Settings/Files tem estados que podem confundir o usuario.

## Findings

### 1. [Alta] Erros de OAuth mobile podem redirecionar para o callback web

Evidencia:

- `services/api/src/main/java/com/planthings/api/auth/OAuthLoginService.java:100-112`
- `services/api/src/main/java/com/planthings/api/auth/OAuthLoginService.java:189-192`

O fluxo feliz preserva `stateEntity.getClient()` ao criar o completion code. Mas se uma excecao ocorre depois de consumir o state, por exemplo falha no exchange com o provider, erro de identidade externa ou erro inesperado, os `catch` chamam:

```java
return buildFrontendCallback(null, null, exception.getCode(), "web");
```

Isso descarta o client salvo no state. Para login iniciado por mobile, o erro deveria voltar para `planthings://oauth/callback?...`, mas cai no callback web configurado.

Impacto:

- usuario mobile nao recebe o retorno no app em cenarios de erro;
- o navegador pode abrir `localhost`/web callback em vez do deep link;
- o app mobile tambem ignora `error` quando recebe callback, entao mesmo os erros que chegarem ao app ficam silenciosos.

Recomendacao:

- manter uma variavel `callbackClient` inicializada com `web` e atualiza-la assim que o state for consumido;
- usar `callbackClient` nos blocos `catch`;
- adicionar teste backend cobrindo start mobile + callback com erro de provider/identity;
- no mobile, tratar `payload.error` em `AuthProvider.handleIncomingUrl`.

### 2. [Alta] Erros de Gmail mobile tambem voltam para a URL web

Evidencia:

- `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationService.java:101-130`
- `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationService.java:249-252`

`completeProviderCallback` consome o state e usa `stateEntity.getClient()` no sucesso e no erro explicito do provider. Porem, qualquer `ApiException` posterior, como codigo ausente, e-mail divergente ou refresh token ausente, cai no `catch` com `"web"`:

```java
return buildFrontendReturn("error", exception.getCode(), "web");
```

Impacto:

- conexao Gmail iniciada no mobile pode terminar no retorno web em cenarios comuns de falha;
- `SettingsScreen` nao recarrega `GET /api/settings` porque o deep link mobile nao chega;
- usuario fica sem feedback consistente.

Recomendacao:

- preservar o client do state em todo o metodo;
- usar o client preservado nos catches;
- adicionar testes mobile para erro de e-mail divergente e refresh token ausente.

### 3. [Alta] Checklist do board mobile nao normaliza o contrato backend e perde o primeiro item

Evidencia:

- `packages/shared-client/src/board.js:63`
- `apps/mobile/src/screens/MobileKanbanBoard.js:283-302`
- `apps/mobile/src/screens/MobileKanbanBoard.js:487-501`
- `apps/mobile/src/screens/MobileKanbanBoard.js:1075-1100`
- `services/api/src/main/java/com/planthings/api/board/BoardService.java:820-823`

O backend retorna itens de checklist como `title` e `completed`, mas a UI mobile renderiza `item.text` e `item.checked`. O normalizador compartilhado repassa `card.checklists` cru, sem adaptar esses campos.

Ha um segundo problema: quando o usuario cria o primeiro item em um cartao sem checklist, a UI cria um checklist local com item local, mas o parent detecta apenas o checklist novo, chama `createChecklist(...)` e retorna. O item digitado nao e enviado ao backend.

Impacto:

- itens vindos do backend aparecem com texto vazio e estado visual incorreto;
- o primeiro item criado junto com o checklist e descartado apos reload;
- toggles podem persistir parcialmente, mas a UI continua renderizando campos errados.

Recomendacao:

- normalizar checklists em `mapBoardCard`, mapeando `title -> text` e `completed -> checked`, preservando os campos originais;
- quando criar checklist com primeiro item, encadear `createChecklist` e depois `createChecklistItem`, ou ajustar o backend/contrato para criar checklist com itens;
- adicionar teste unitario para `mapBoardCard` com checklist vindo do backend.

### 4. [Alta] Edicao de data no card mobile nao persiste no contrato usado pelo provider

Evidencia:

- `apps/mobile/src/screens/MobileKanbanBoard.js:259-263`
- `apps/mobile/src/screens/MobileKanbanBoard.js:685-701`
- `packages/shared-client/src/board.js:92-110`

O modal de data grava apenas `dueDate` textual, com placeholder como `12 ago`. O payload de persistencia, porem, ignora `dueDate` e monta `startAt`/`dueAt` a partir de `card.schedule`.

Impacto:

- usuario ve a data mudando localmente, mas a mudanca nao chega ao backend;
- ao recarregar o board, a data volta ao valor anterior ou fica vazia.

Recomendacao:

- alinhar a UI com `schedule.dueEnabled`, `schedule.dueDateValue` e `schedule.dueTimeValue`;
- ou fazer `buildBoardCardPayload` aceitar a representacao usada pela tela mobile;
- evitar entrada livre como `12 ago` se o payload exige data parseavel.

### 5. [Alta] "Arquivar" card no mobile executa delete real

Evidencia:

- `apps/mobile/src/screens/MobileKanbanBoard.js:578-617`
- `apps/mobile/src/screens/MobileKanbanBoard.js:1128-1136`

No menu do card, "Arquivar" e "Excluir" chamam `onDeleteCard(card.id)`. O provider persiste isso via `DELETE /api/plans/{planId}/board/cards/{cardId}`.

Impacto:

- uma acao visualmente reversivel/menos destrutiva remove o card de verdade;
- isso contraria a regra de nao prometer persistencia inexistente quando nao ha endpoint correspondente.

Recomendacao:

- remover/desabilitar "Arquivar" ou trocar o texto para a semantica real;
- criar endpoint de arquivamento apenas se esse comportamento existir no produto.

### 6. [Media] `MobileKanbanBoard` viola a ordem de hooks quando o plano ainda nao existe

Evidencia:

- `apps/mobile/src/screens/MobileKanbanBoard.js:874-891`
- `apps/mobile/src/screens/MobileKanbanBoard.js:892-917`

A tela retorna "Carregando plano..." antes de chamar `useMemo` e outro `useEffect`. Se uma renderizacao inicial ocorrer sem `plan` e uma renderizacao posterior tiver `plan`, o componente passa a chamar mais hooks do que antes.

Impacto:

- risco de erro runtime do React: "Rendered more hooks than during the previous render";
- pode acontecer em entrada direta no board, estado de provider ainda nao hidratado ou planId invalido que depois carrega.

Recomendacao:

- mover todos os hooks para antes do early return;
- fazer os hooks tolerarem `plan` nulo usando defaults.

### 7. [Media] Home mobile sobrescreve descricao/data reais com metadados estaticos

Evidencia:

- `apps/mobile/src/screens/HomeScreen.js:40-57`
- `apps/mobile/src/screens/HomeScreen.js:59-71`

`getPlanViewModel` faz `{ ...plan, ...meta, cover }`, entao `plan.description` e `plan.date` vindos da API sao substituidos por `planMeta` estatico.

Impacto:

- Home mostra descricoes/datas que nao pertencem ao plano real;
- busca local pesquisa tambem descricoes artificiais;
- a integracao parece real, mas ainda exibe conteudo demonstrativo no fluxo principal.

Recomendacao:

- inverter a ordem para preservar campos reais;
- usar fallback estatico somente quando o backend nao trouxer valor.

### 8. [Media] Workspace em Settings mobile nao e pre-carregado pelo snapshot atual

Evidencia:

- `apps/mobile/src/screens/SettingsScreen.js:147-149`
- `apps/mobile/src/screens/SettingsScreen.js:557-570`
- `services/api/src/main/java/com/planthings/api/settings/SettingsService.java:257-262`

`SettingsScreen` espera `snapshot.workspace` para preencher `workspaceNameValue`, mas `SettingsSnapshot` do backend nao inclui workspace. Como o estado inicial e `''`, a sheet "Workspace" abre com input vazio apesar de a tela principal mostrar `session.workspace.name`.

Impacto:

- usuario precisa redigitar o nome atual;
- ha risco de salvar acidentalmente um nome incompleto;
- o contrato esperado pelo mobile e o snapshot real estao desalinhados.

Recomendacao:

- inicializar `workspaceNameValue` com `session.workspace.name`;
- ou incluir workspace no snapshot de settings;
- se incluir no snapshot, ajustar testes de Settings.

### 9. [Media] Toggles de notificacao no mobile sao otimistas e compartilham campo indevidamente

Evidencia:

- `apps/mobile/src/screens/SettingsScreen.js:116-119`
- `apps/mobile/src/screens/SettingsScreen.js:133-142`
- `apps/mobile/src/screens/SettingsScreen.js:165-184`
- `apps/mobile/src/screens/SettingsScreen.js:380-407`

"Resumo diario" e "Mencoes" usam o mesmo campo backend, `emailNotifs`. Ao alternar um, ambos passam a refletir o mesmo valor apos `persistNotifications`. Alem disso, o estado local e atualizado antes da request e nao ha `catch`/rollback se a API falhar.

Impacto:

- um toggle pode alterar outro sem o usuario pedir;
- falha de API deixa a UI mostrando estado nao persistido;
- dificil saber qual preferencia realmente existe no backend.

Recomendacao:

- mapear a UI para os tres campos reais do backend, ou desabilitar/renomear toggles sem campo proprio;
- aplicar estado local apenas apos sucesso ou recarregar/reverter em erro;
- exibir feedback de falha.

### 10. [Media] Download de arquivo no mobile nao entrega arquivo ao usuario

Evidencia:

- `apps/mobile/src/providers/FilesProvider.js:49-51`
- `apps/mobile/src/screens/FilesScreen.js:672-676`

`downloadFile` retorna um blob, mas a tela chama `void downloadFile(...)` e fecha a sheet. Nao ha uso de `expo-file-system`, `Sharing`, browser anchor no web preview, ou qualquer feedback visual.

Impacto:

- o usuario toca "Baixar" e nada perceptivel acontece;
- no nativo, o blob nao vira arquivo salvo/compartilhavel;
- no web preview, o download tambem nao e disparado.

Recomendacao:

- implementar estrategia mobile com FileSystem/Sharing;
- no web preview, reaproveitar helper web-only ou criar fluxo especifico;
- ate la, desabilitar ou marcar como "Em breve".

### 11. [Media] Anexos de card nao tem remocao na UI e "Biblioteca" escolhe arquivo arbitrario

Evidencia:

- `apps/mobile/src/providers/PlansProvider.js:189-190`
- `apps/mobile/src/screens/MobileKanbanBoard.js:457-465`
- `apps/mobile/src/screens/MobileKanbanBoard.js:1103-1110`

O provider expoe `removeAttachment`, mas nenhuma tela chama a acao. Na adicao via biblioteca, a UI cria um anexo local generico e o parent pega o primeiro arquivo nao-pasta da lista, sem permitir escolher o arquivo.

Impacto:

- usuario nao consegue remover anexos apesar de haver endpoint;
- "Biblioteca" pode anexar arquivo errado;
- a UI mostra uma escolha que nao existe de fato.

Recomendacao:

- adicionar seletor simples de arquivo antes de chamar `attachFileToCard`;
- adicionar botao de remover anexo quando `canRemove` for true;
- remover o anexo local otimista se a chamada falhar.

### 12. [Media] Acoes visuais de Files prometem persistencia que nao existe

Evidencia:

- `apps/mobile/src/screens/FilesScreen.js:52-61`
- `apps/mobile/src/screens/FilesScreen.js:293-310`
- `apps/mobile/src/screens/FilesScreen.js:321-339`
- `apps/mobile/src/screens/FilesScreen.js:807-823`

Exemplos:

- "Renomear" fecha a sheet sem chamar backend.
- "Arquivados" existe como secao/mover, mas nao ha endpoint nem estado persistido.
- "Digitalizar", Word, PowerPoint e Excel abrem fluxo e botao "Concluir", mas nao criam nada.

Impacto:

- acoes parecem reais, mas nao persistem;
- usuario pode acreditar que criou/moveu/renomeou algo quando nada aconteceu.

Recomendacao:

- desabilitar itens sem endpoint e marcar como "Em breve";
- ou implementar endpoints/handlers reais;
- evitar botao "Concluir" em fluxos que nao executam trabalho.

### 13. [Media] Ordenacao de Files por tamanho e recentes nao usa os dados reais corretamente

Evidencia:

- `packages/shared-client/src/files.js:52-55`
- `apps/mobile/src/screens/FilesScreen.js:87-118`
- `apps/mobile/src/screens/FilesScreen.js:195-204`
- `services/api/src/main/java/com/planthings/api/common/time/BrazilDateTimeMapper.java:14-17`

`mapApiFileItem` guarda `size` como numero, mas `parseFileSize` espera string com unidade (`KB`, `MB`, etc). Para datas, o backend envia texto como `dd/MM/yyyy HH:mm`, mas `parseModifiedToMinutesAgo` so entende strings relativas como `agora`, `ontem` e `ha 3 min`.

Impacto:

- ordenacao por tamanho tende a tratar itens numericos como `0`;
- "Recentes" pode ordenar de forma arbitraria ou pelo reverse da lista atual, nao pelo `modifiedAtIso` real.

Recomendacao:

- ordenar tamanho pelo numero `file.size`;
- ordenar recentes por `modifiedAtIso`/`createdAtIso`.

### 14. [Media] Textos de Gmail em Settings prometem leitura/importacao fora do MVP

Evidencia:

- `apps/mobile/src/screens/SettingsScreen.js:357-365`

O texto da secao diz "Conecte servicos para automatizar sua caixa de entrada" e o hint do Gmail diz "Importe mensagens e envie resumos". O backend implementado cobre conectar/desconectar e envio Gmail para convites/inbox, mas nao cobre leitura/importacao real de Gmail no app mobile.

Impacto:

- expectativa do usuario fica acima do que a entrega suporta;
- contradiz a fronteira tecnica do MVP.

Recomendacao:

- ajustar copy para "Conectar Gmail para envio/recursos futuros" ou similar;
- deixar importacao/leitura explicitamente fora da promessa visual.

### 15. [Baixa] OAuth mobile ignora `error` recebido no deep link

Evidencia:

- `apps/mobile/src/providers/AuthProvider.js:71-75`
- `apps/mobile/src/providers/AuthProvider.js:139-151`

`parseOAuthUrl` captura `error`, mas `handleIncomingUrl` so age quando ha `redirectTo` ou `code`.

Impacto:

- mesmo quando o backend redirecionar erro para mobile, a UI nao mostra feedback;
- usuario volta ao app sem saber por que o login nao concluiu.

Recomendacao:

- manter um estado de erro OAuth no provider ou expor callback para `AuthScreen`;
- limpar o erro apos exibicao;
- em web preview, remover query string tambem em erro.

### 16. [Baixa] Linking config declara tela OAuth inexistente

Evidencia:

- `apps/mobile/App.js:12-25`
- `apps/mobile/src/screens/AppShell.js:30-40`

O linking config declara `OAuthCallback: 'oauth/callback'`, mas nao ha screen `OAuthCallback` registrada. O callback e processado manualmente por `AuthProvider`, entao a entrada no config pode gerar warnings/estado de navegacao nao mapeado.

Impacto:

- ruido em deep links;
- risco de comportamento inesperado se React Navigation tentar resolver o path.

Recomendacao:

- remover `OAuthCallback` do linking config se o provider for o unico responsavel;
- ou registrar uma screen neutra de callback.

### 17. [Baixa] `relative: false` passado pelo mobile nao e usado pelo shared api client

Evidencia:

- `apps/mobile/src/services/api.js:8-13`
- `packages/shared-client/src/apiClient.js:30-41`
- `packages/shared-client/src/apiClient.js:62-63`

`mobileApiRequest` passa `relative: false`, mas `apiRequest` nao le essa opcao ao chamar `buildApiUrl`. Hoje o fallback mobile define `baseUrl`, entao o fluxo normal funciona. O problema aparece se `EXPO_PUBLIC_API_BASE_URL` vier como string vazia.

Impacto:

- configuracao vazia pode gerar request relativa em vez de URL absoluta;
- comportamento fica diferente de `mobileApiUrl`, que passa `relative: false` diretamente.

Recomendacao:

- adicionar `relative` ao destructuring de `apiRequest`;
- repassar para `buildApiUrl`.

## Pontos positivos confirmados

- Endpoints principais chamados por `PlansProvider` batem com `PlanController`, `BoardController` e `FileController`.
- `AuthController` e `SettingsController` aceitam `client` nos payloads de start OAuth/Gmail.
- `OAuthLoginStateEntity` e `GmailOAuthStateEntity` tem coluna/campo `client`.
- Migration V10 usa `EXEC(...)` para evitar o problema de batch do SQL Server ao referenciar coluna recem-criada.
- Web envia `{ client: 'web' }` no OAuth e no start Gmail.
- Mobile registra o scheme `planthings` em `app.json`.
- O pacote compartilhado esta livre de dependencias browser-only na auditoria estatica.

## Prioridade sugerida

1. Corrigir callback de erro OAuth/Gmail preservando `client`.
2. Corrigir checklist/data do board mobile, porque ha perda ou falsa persistencia de dados.
3. Remover/desabilitar acoes que nao persistem, especialmente "Arquivar" card, download, rename/move/archive em Files e criacao de documentos.
4. Ajustar Settings mobile para workspace, notificacoes e copy de Gmail.
5. Adicionar testes cobrindo os fluxos mobile de erro e normalizacao de board/files.
