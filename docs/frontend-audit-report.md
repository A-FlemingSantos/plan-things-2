# Front-end Audit Report

Date: 2026-04-08

## Escopo

Este relatório substitui integralmente a versão anterior da auditoria.

O objetivo desta revisão atualizada é registrar o estado do projeto após a rodada de correções documentada em `docs/frontend-audit-fixes.md`, verificando:

- se os problemas apontados na auditoria original foram realmente resolvidos
- se o comportamento atual do código bate com o que os documentos afirmam
- se ainda existe alguma inconsistência que impeça considerar o front-end realmente polido

## Metodologia

A revalidação foi feita com base em:

- leitura de `docs/frontend-audit-fixes.md`
- inspeção dos arquivos alterados na rodada de correção
- comparação entre o código atual e os problemas anteriormente reportados
- execução de:
  - `npm run test:run`
  - `npm run build`
- revisão dos fluxos críticos de:
  - aliases legados
  - `Files`
  - persistência do shell
  - modal de datas do card

## Resumo Executivo

As correções registradas nas rodadas anteriores foram efetivamente aplicadas.

Hoje o projeto está em um estado consistente e bem polido:

- o bug de runtime no breadcrumb de `Files` foi corrigido
- os deep links legados com `planId` preservam o plano corretamente
- o estado de colapso da sidebar persiste entre telas do produto
- os uploads simulados em `Files` limpam intervalos corretamente
- a reidratação do `schedule` para cards legados/seedados foi corrigida
- a suíte de smoke tests foi ampliada e continua verde

Não identifiquei mais inconsistências funcionais relevantes que impeçam considerar a auditoria essencialmente encerrada.

Existe apenas um resíduo pequeno de cobertura automatizada:

- a nova suíte valida o fluxo legado com `Aug 3`, mas não há um teste equivalente para o valor relativo `Today`

## Status Atual dos Itens da Auditoria Anterior

### Resolvidos

1. breadcrumb/runtime em `Files`
2. deep links legados sem preservação de `planId`
3. persistência do colapso da sidebar entre telas
4. limpeza de intervalos de upload em `Files`

### Resolvido Nesta Ultima Rodada

5. inconsistência entre UI de datas do modal e persistência real

## Validação Executada

### Testes

`npm run test:run` passou com sucesso.

Resultado atual:

- `10/10` testes passando

Cobertura adicionada nas rodadas de correção:

- redirect legado de board com `planId`
- redirect legado de canvas com `planId`
- navegação em pasta dentro de `Files`
- persistência do colapso da sidebar entre telas
- estabilidade de `dueDate` legado ao abrir e salvar o modal de datas

### Build

`npm run build` passou com sucesso.

## Resíduo Atual

### Cobertura automatizada ainda não inclui um caso explícito para `Today`

Severity: Low

#### Resumo

O fluxo residual do modal de datas foi corrigido:

- o contrato agora deriva `schedule.dueDateValue` a partir de `dueDate` legado
- o modal respeita o estado reidratado
- labels relativas podem ser preservadas quando o usuário apenas abre e salva

A suíte já cobre o caso legado com `Aug 3`, mas ainda não existe um teste equivalente para o valor relativo `Today`.

#### Impacto real

Não há evidência atual de bug funcional nesse caso. A implementação parece coerente para `Today`, e o projeto compila e testa normalmente.

O ponto residual é de confiança automatizada, não de comportamento já comprovadamente quebrado.

#### Evidências

Arquivos relevantes:

- `src/shared/contracts/planContracts.js`
- `src/features/workspace/components/CardModal/CardModal.jsx`
- `src/features/workspace/data/boardTemplates.js`
- `src/test/app.smoke.test.jsx`

O que já está coberto:

- cards legados com `dueDate` no formato `Mon DD`
- reidratação correta de `03/08/26` para `Aug 3`
- estabilidade do label ao abrir e salvar sem alterar

O que ainda não está coberto por teste dedicado:

- card seedado com `dueDate: 'Today'`

#### Recomendação

Adicionar um teste complementar para:

1. abrir um card seedado com `dueDate: 'Today'`
2. abrir o menu `Datas`
3. salvar sem alterar
4. confirmar que o board continua exibindo `Today`

## Itens Revalidados como Resolvidos

### 1. `Files` breadcrumb/runtime

Status: resolved

O breadcrumb agora renderiza `crumb.name`, e o fluxo de navegação em pasta passou a ser coberto por smoke test.

### 2. Legacy deep links com `planId`

Status: resolved

Os aliases dinâmicos foram adicionados e os redirecionamentos reconstroem o caminho canônico com `planId`.

### 3. Persistência do colapso da sidebar

Status: resolved

O shell passou a usar `localStorage`, e a persistência entre telas agora está alinhada com a expectativa de produto.

### 4. Cleanup dos uploads em `Files`

Status: resolved

Os intervalos passaram a ser rastreados em `ref`, limpos ao concluir, ao dismiss e no unmount.

### 5. Reidratação do `schedule` para cards legados/seedados

Status: resolved

O contrato agora deriva estado estruturado a partir de `dueDate` legado, e o modal preserva corretamente o label exibido quando o usuário apenas abre e salva sem alterar o valor.

## Avaliação Final

O projeto está em bom estado e a auditoria funcional pode ser considerada essencialmente concluída.

Estruturalmente e comportamentalmente, os problemas que motivaram a auditoria foram resolvidos. A base segue saudável em build e testes, e o último problema funcional relevante do modal de datas foi corrigido.

O único resíduo remanescente é pequeno e fica no nível de cobertura automatizada:

- falta um teste explícito para o caso relativo `Today`

## Conclusão

Status recomendado do projeto neste momento:

- pronto para encerrar a auditoria funcional
- bem polido no geral
- com uma pequena oportunidade de reforço na suíte automatizada

Se desejado, o próximo passo natural é apenas complementar a cobertura de teste para `Today`. Fora isso, o front-end já pode ser tratado como auditado e consistente.
