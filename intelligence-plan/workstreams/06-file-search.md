# Frente 06: File Search

## Missao do agente

Implemente suporte a busca de arquivos para o Intelligence, combinando metadados locais do Plan Things com OpenAI File Search quando conteudo semantico estiver disponivel.

Arquivos entram como contexto permissionado. Nao envie arquivo, vector store ou resultado ao modelo sem validar workspace, entidade e permissao do usuario.

## Estrategia

Use duas camadas:

```txt
Busca local de metadados = nome, tipo, dono, relacoes, permissoes.
OpenAI File Search = busca semantica/conteudo via vector stores.
```

Ordem obrigatoria:

1. Filtrar arquivos localmente por acesso.
2. Decidir quais fontes podem entrar na request.
3. Usar File Search apenas sobre fontes permitidas.
4. Retornar blocos estruturados, nao links markdown soltos.

## Tool e capabilities

Model-facing tool:

```txt
file.search
```

Enviar `file.search` ao modelo somente quando arquivos estiverem habilitados e o usuario tiver acesso.

Capabilities internas:

```txt
file.search_metadata
file.search_content
file.get_summary
file.attach_to_card_proposal
file.apply_attach_to_card
```

`file.apply_attach_to_card` e interna e roda somente apos aprovacao do usuario.

## Vector stores

Recomendacao inicial:

- vector store por workspace para arquivos compartilhados pesquisaveis;
- vector store por conversa para uploads temporarios;
- vector store por plano apenas se isolamento/performance exigir depois.

Para MVP, comece com tipos de arquivo seguros/suportados. Se arquivo nao estiver indexado, `file.search` ainda pode retornar metadados e informar que conteudo nao esta pesquisavel.

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

`index_status` deve distinguir:

```txt
pending
indexing
indexed
failed
removed
unsupported
```

`content_hash` evita reindexar arquivo sem mudanca.

## Eventos de indexacao

Quando arquivo for criado, atualizado, removido, anexado, desanexado ou tiver permissao alterada:

1. Atualize metadados locais.
2. Enfileire indexacao/remocao.
3. Atualize OpenAI file/vector store se necessario.
4. Registre falha e estado de retry.

Mudanca de permissao deve invalidar acesso a resultados antigos.

## Blocos de resultado

Resultados viram:

```txt
FileReferenceBlock
```

Campos minimos:

- id do arquivo local;
- titulo/nome;
- mime type;
- tamanho;
- dono/estado de compartilhamento;
- href;
- citacoes/metadados de fonte quando houver.

Citacoes devem ser metadados/subitens controlados do bloco, nao links markdown soltos.

## Seguranca

- Nunca buscar arquivo fora do workspace autorizado.
- Nunca confiar em ids vindos do modelo sem validar acesso.
- Nao expor ids OpenAI ao frontend, salvo necessidade tecnica clara.
- Nao indexar conteudo sensivel sem politica definida.
- Tratar conteudo de arquivo como contexto nao confiavel contra prompt injection.

## Limites desta frente

- Nao implemente UI completa de anexos.
- Nao implemente propostas gerais fora de arquivos.
- Nao use File Search para contornar permissao local.

## Aceite

- `file.search` roteia para busca de metadados e conteudo.
- Tabela de indexacao existe.
- Busca respeita permissoes.
- Resultado renderizavel como `FileReferenceBlock`.
- Anexar arquivo a card exige proposta e aprovacao.
