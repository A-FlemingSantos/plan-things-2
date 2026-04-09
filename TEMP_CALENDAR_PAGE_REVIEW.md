# Revisao temporaria: CalendarPage backend readiness

Este arquivo resume as implementacoes e correcoes feitas na nova pagina de calendario para orientar uma segunda revisao. Ele e temporario e pode ser removido depois da validacao.

## Contexto do pedido

A `CalendarPage` tinha sido apontada com cinco problemas principais:

- Eventos e fontes estavam hard-coded dentro da propria pagina, sem contrato, repository ou hook.
- Os botoes de visualizacao (`Dia`, `Semana de trabalho`, `Semana`, `Mes`, `Modo divisao`) so mudavam estado visual, mas a tela continuava sempre mensal.
- A navegacao de mes alterava `visibleMonth`, mas deixava `selectedDate` fora de sincronia.
- A busca assumia campos sempre presentes (`event.title`, `event.location`) e podia quebrar com payloads incompletos do backend.
- Alguns controles eram renderizados sem comportamento, como navegacao do mini calendario e acoes da toolbar/sidebar.

Depois, foi solicitado remover `Modo divisao` e manter a agenda lateral dentro da propria view `Mes`, com um botao `X` para fechar.

## Arquivos adicionados

### `src/shared/contracts/calendarContracts.js`

Novo contrato/normalizer do calendario. Ele cria uma fronteira mais parecida com as demais areas do app.

Principais exports:

- `normalizeCalendarSource(source)`
- `normalizeCalendarEvent(event, sourcesById)`
- `normalizeCalendarSnapshot(snapshot)`

Comportamento importante:

- Garante defaults para `id`, `title`, `date`, `start`, `end`, `calendar`, `sourceId`, `color` e `location`.
- `date` e aceito apenas no formato `YYYY-MM-DD`; quando invalido, cai para a data atual.
- `location` vira string vazia quando ausente, para a busca e a renderizacao nao quebrarem.
- IDs novos sao criados via `createClientId`, nao por `Date.now()`.

### `src/features/calendar/data/calendarRepository.js`

Novo repository local, sem HTTP e sem `localStorage`.

Principais exports:

- `createInitialCalendarSnapshot()`
- `createCalendarEventDraft(data, sources)`
- `insertCalendarEvent(events, event)`

Comportamento importante:

- Os dados seedados (`CALENDAR_SOURCES` e `CALENDAR_EVENTS`) sairam da pagina e foram movidos para este repository.
- Um evento seed (`Release checkpoint`) foi deixado sem `location` de proposito para exercitar a normalizacao e a busca segura.
- `insertCalendarEvent` mantem a lista ordenada por `date` + `start`.

### `src/features/calendar/hooks/useCalendarEvents.js`

Novo hook para a pagina consumir o calendario por uma API local.

Retorno:

- `events`
- `calendarSources`
- `filteredEvents`
- `createEvent`

Comportamento importante:

- Inicializa o estado com `createInitialCalendarSnapshot()`.
- Centraliza a busca por `title`, `location` e `calendar`.
- A busca fica segura porque os eventos ja passam pelo normalizer antes.
- `createEvent` delega a criacao para o repository e retorna o evento criado.

## Arquivos alterados

### `src/features/calendar/pages/CalendarPage/CalendarPage.jsx`

Principais mudancas:

- Removeu `INITIAL_EVENTS` e `CALENDAR_SOURCES` locais.
- Passou a consumir `useCalendarEvents({ search })`.
- Removeu criacao de id com `Date.now()` no dialog.
- Passou a usar `WORKSPACE_NAV_ITEMS` para reduzir duplicacao de navegacao.
- Implementou views reais:
  - `Dia`: range de 1 dia.
  - `Semana de trabalho`: segunda a sexta.
  - `Semana`: domingo a sabado.
  - `Mes`: grade mensal com agenda lateral.
- Removeu a view `Modo divisao`.
- A agenda lateral agora fica dentro da view `Mes` por padrao.
- A agenda lateral tem botao `Fechar agenda` (`aria-label="Fechar agenda"`) com icone `X`.
- Quando a agenda esta fechada, a grade mensal ocupa toda a largura via `calendarWorkspaceFull`.
- Ao clicar em um dia/evento da grade mensal, a agenda lateral reabre e mostra a data selecionada.
- A navegacao de mes (`shiftMonth`) agora sincroniza `visibleMonth` e `selectedDate`, preservando o dia quando possivel e clampando para o ultimo dia do mes quando necessario.
- O mini calendario agora tem handlers reais para mes anterior/proximo.
- Acoes sem backend real agora mostram feedback:
  - `Adicionar calendario`: toast de conexao futura.
  - Fonte de calendario: toast informando fonte ativa.
  - `Filtro`: toast de filtros avancados em breve.
  - `Compartilhar`: toast de link copiado.
  - `Imprimir`: chama `window.print()`.
- Foi adicionado toast com `role="status"` e limpeza de timer no unmount.

Observacoes para revisar:

- A rota continua global em `/calendar`, sem `:planId`, conforme a decisao de produto.
- Nao ha client HTTP real; o objetivo foi deixar boundary local consistente para futuro backend.
- A view `Mes` continua mostrando eventos seedados de abril de 2026; o heading inicial usa a data real atual, entao em meses diferentes os seeds podem estar fora do mes inicial ate navegar para abril de 2026.

### `src/features/calendar/pages/CalendarPage/CalendarPage.module.css`

Principais mudancas:

- Adicionou `calendarWorkspaceFull` para a grade mensal ocupar a largura inteira quando a agenda lateral estiver fechada.
- Ajustou `agendaHeader` para acomodar titulo/contador e botao de fechar.
- Adicionou `agendaCloseButton`.
- Adicionou estilos para as views de range:
  - `rangeWorkspace`
  - `rangeDay`
  - `rangeDaySelected`
  - `rangeDayHeader`
  - `rangeWeekday`
  - `rangeDayNumber`
  - `rangeEventList`
  - `rangeEvent`
  - `rangeEmpty`
- Adicionou toast `notification` e animacao `toastIn`.
- Adicionou responsividade para `rangeWorkspace` nos breakpoints existentes.

### `src/test/app.smoke.test.jsx`

Principais mudancas:

- O teste da pagina de calendario nao depende mais de `abril 2026`; agora usa `formatCalendarHeading()` baseado na data atual.
- Adicionou cobertura para:
  - alternar `Dia`, `Semana de trabalho`, `Semana` e `Mes`;
  - verificar que `Modo divisao` nao aparece mais;
  - fechar a agenda lateral com `Fechar agenda`;
  - reabrir a agenda ao clicar no evento/dia da grade;
  - navegar mes anterior/proximo mantendo heading esperado;
  - criar evento e validar toast de sucesso;
  - buscar `Release checkpoint`, que exercita evento normalizado sem `location`.

## Verificacoes executadas

Foram executados:

```bash
npm run test:run
npm run build
```

Resultado:

- `npm run test:run`: 14 testes passaram.
- `npm run build`: passou.

Observacao: os comandos exibem warnings do Vite sobre `esbuild`/`oxc`, ja existentes no ambiente de build/test. Nao foram introduzidos como erro funcional.

## Pontos recomendados para a segunda revisao

- Conferir se a decisao de manter o calendario global em `/calendar` esta refletida corretamente na navegacao e se nao ha necessidade de `:planId`.
- Conferir se a view `Mes` com agenda lateral fechavel esta de acordo com o comportamento esperado:
  - aberta por padrao;
  - fecha no `X`;
  - reabre ao clicar em um dia/evento da grade.
- Conferir se a normalizacao em `calendarContracts.js` e suficiente para payloads incompletos do backend futuro.
- Conferir se `window.print()` deve permanecer direto na view ou ser abstraido caso o backend/infra de produto exija outro fluxo.
- Conferir se, no futuro, os seeds fixos de abril de 2026 devem ser trocados por dados relativos a data atual ou carregados por API.
