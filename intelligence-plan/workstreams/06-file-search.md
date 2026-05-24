# Frente 06: File Search

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Permitir que Intelligence busque metadados e conteudo de arquivos respeitando permissoes do Plan Things.

## Busca em duas camadas

Usar duas camadas:

```txt
Busca local de metadados = nome, tipo, dono, relacoes, permissoes.
OpenAI File Search = busca semantica/conteudo via vector stores.
```

File Search nao substitui controle local de acesso.

## Model-facing tool

Expor apenas:

```txt
file.search
```

quando arquivos estiverem habilitados e o usuario tiver acesso.

Capabilities internas:

```txt
file.search_metadata
file.search_content
file.get_summary
file.attach_to_card_proposal
file.apply_attach_to_card
```

`file.apply_attach_to_card` e interna e roda apenas depois da aprovacao do usuario.

## Estrategia de vector store

Recomendacao:

- vector store por workspace para arquivos compartilhados pesquisaveis;
- vector store por conversa para uploads temporarios no chat;
- vector store por plano apenas depois, se isolamento/performance exigirem.

Antes de incluir vector store ou arquivo em uma request ao modelo, o backend deve filtrar por workspace, plano, permissoes de arquivo e acesso do usuario.

## Tabela

```txt
ai_file_index
- id
- workspace_id
- plan_id nullable
- file_id
- openai_file_id
- openai_vector_store_id
- index_status
- content_hash
- last_indexed_at
- created_at
```

## Eventos de indexacao

Quando arquivo for criado, atualizado, removido, anexado, desanexado ou tiver permissao alterada:

1. atualizar metadados locais;
2. enfileirar indexacao/remocao;
3. atualizar arquivo/vector store na OpenAI se necessario;
4. registrar falha e estado de retry.

## Blocos de resultado

Resultados de arquivo devem virar:

```txt
FileReferenceBlock
```

com:

- id do arquivo;
- titulo/nome;
- mime type;
- tamanho;
- dono/estado de compartilhamento;
- href;
- metadados opcionais de citacao/fonte.

## Seguranca

- Nunca buscar arquivos fora do escopo autorizado do workspace.
- Nunca confiar em ids de arquivo vindos do modelo sem validar acesso.
- Nao expor ids de arquivo da OpenAI ao frontend, salvo se necessario.
- Evitar indexar arquivos sensiveis ou nao suportados ate existir politica clara.

## Definition of Done

- `file.search` roteia para capabilities locais de metadados e conteudo.
- Tabela de indexacao de arquivos existe.
- Busca respeita permissoes.
- Resultados de arquivo renderizam como blocos estruturados, nao apenas links markdown.
- Propostas de anexar arquivo exigem aprovacao do usuario.

