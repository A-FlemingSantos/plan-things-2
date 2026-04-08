# Frontend Audit Fixes

Este arquivo registra apenas a melhoria mais recente aplicada após a última revalidação da auditoria.

## Correção Aplicada

### Cobertura automatizada para o caso legado com `dueDate: 'Today'`

Após a correção funcional da reidratação de `schedule`, restava uma pequena lacuna de confiança automatizada:

1. o fluxo legado com datas no formato `Mon DD` já estava coberto
2. o caso relativo `Today` ainda não tinha um teste explícito

O comportamento já estava implementado corretamente, mas ainda faltava uma verificação automatizada dedicada para esse cenário.

## O que foi feito

Foi adicionado um novo smoke test para o fluxo de card seedado com `dueDate: 'Today'`.

O teste cobre:

1. abrir o card `Launch campaign copy`
2. abrir o menu `Datas`
3. verificar o valor reidratado do campo `Due date`
4. salvar sem alterar nada
5. confirmar que o board continua exibindo `Today`

## Arquivo alterado

1. [app.smoke.test.jsx](/C:/Users/Arthur%20Fleming/plan-things/src/test/app.smoke.test.jsx)

## Validação

Validação concluída com sucesso:

1. `npm run test:run` -> `11/11` testes passando

## Resultado

O último resíduo pequeno apontado na auditoria, que era apenas de cobertura automatizada, foi encerrado.
