# Relatório de Verificação por Página

Data da verificação: 10/04/2026  
Método: inspeção de código + suíte automatizada RTL/Vitest + build de produção

## Baseline

- `npm run test:run`: verde
- `npm run build`: verde

## Achados

### Global / App shell

- Sem achados.

### `/`

- `P2` Mobile download: os badges "App Store" e "Google Play" levam para `#mobile`, não para um destino de download. Evidência em `src/features/landing/components/MobileDownload/MobileDownload.jsx`.
- `P3` Footer social: os ícones com rótulo `Twitter`, `LinkedIn` e `GitHub` levam para âncoras internas da landing, apesar de a UI sugerir links sociais externos. Evidência em `src/features/landing/components/Footer/Footer.jsx`.

### `/login` e `/cadastro`

- `P1` Autenticação por e-mail: o formulário navega para `/workspace` após o loading mesmo sem validação de e-mail ou senha. Evidência em `src/features/auth/pages/Auth/Auth.jsx`.
- `P1` Cadastro: o checkbox de aceite de termos não é exigido antes de concluir o cadastro. Evidência em `src/features/auth/pages/Auth/Auth.jsx`.

### `/forgot`, `/help`, `/privacy`, `/terms`

- Sem achados. As páginas se declaram explicitamente como placeholder.

### `/workspace`

- `P2` Criar plano: a ação "Enviar imagem própria" abre o seletor de arquivo, mas o arquivo escolhido não é lido nem aplicado ao preview ou ao plano criado. Evidência em `src/features/workspace/pages/Workspace/Workspace.jsx`.

### `/workspace/board/:planId`

- `P2` Modal de cartão: os botões de navegação de mês do seletor de datas (`«`, `‹`, `›`, `»`) são renderizados sem handler. Evidência em `src/features/workspace/components/CardModal/CardModal.jsx`.
- `P2` Datas de checklist: o seletor de datas do checklist repete o mesmo problema; os botões de navegação mensal são inertes. Evidência em `src/features/workspace/components/CardModal/CardModal.jsx`.
- `P2` Caixa de entrada: o botão "Adicionar um cartão" é exibido como ação principal, mas não dispara nenhuma ação. Evidência em `src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`.

### `/canvas/:planId`

- Sem achados relevantes na verificação atual.

### `/calendar`

- Sem achados relevantes na verificação atual.

### `/files/*`

- `P2` Inspetor de arquivo: as abas `Atividade`, `Versões` e `Compartilhamento` são exibidas como se fossem navegáveis, mas não trocam conteúdo nem possuem ação associada; apenas `Detalhes` existe de fato. Evidência em `src/features/files/pages/FilesPage/FilesPage.jsx`.

## Observações

- Funcionalidades marcadas como "em breve" ou placeholders explícitos foram tratadas como comportamento esperado quando havia feedback claro ao usuário.
- A verificação não classificou perda de dados após reload como bug, porque o estado atual é local/em memória e a UI não promete persistência real.


