# Frente 06: File Search

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Permitir que Intelligence busque metadados e conteudo de arquivos respeitando permissoes do Plan Things.

A intencao desta frente e fazer arquivos entrarem no assistente como contexto permissionado, nao como upload solto para o modelo. O backend deve saber quais arquivos existem, quem pode ve-los, qual conteudo foi indexado e como transformar resultados em blocos navegaveis.

## Busca em duas camadas

Usar duas camadas:

```txt
Busca local de metadados = nome, tipo, dono, relacoes, permissoes.
OpenAI File Search = busca semantica/conteudo via vector stores.
```

File Search nao substitui controle local de acesso.

A busca local responde "quais arquivos o usuario pode consultar?". File Search responde "o que dentro desses arquivos parece relevante?". A ordem importa: primeiro filtra acesso local, depois usa busca semantica/conteudo somente sobre fontes permitidas.

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

`file.search` deve poder combinar metadados e conteudo. Exemplo: buscar "contrato do cliente X" pode primeiro restringir por nome/projeto e depois usar File Search para trechos relevantes. O modelo nao deve receber ids internos de vector store como se fossem permissao.

## Estrategia de vector store

Recomendacao:

- vector store por workspace para arquivos compartilhados pesquisaveis;
- vector store por conversa para uploads temporarios no chat;
- vector store por plano apenas depois, se isolamento/performance exigirem.

Antes de incluir vector store ou arquivo em uma request ao modelo, o backend deve filtrar por workspace, plano, permissoes de arquivo e acesso do usuario.

Para o MVP, comece com metadados locais e indexacao dos tipos mais seguros/suportados. Se um arquivo nao estiver indexado, `file.search` ainda pode retornar metadado e indicar que conteudo nao esta disponivel para busca semantica.

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

`content_hash` evita reindexar arquivo sem mudanca. `index_status` precisa distinguir pendente, indexando, indexado, falhou, removido e nao suportado.

## Eventos de indexacao

Quando arquivo for criado, atualizado, removido, anexado, desanexado ou tiver permissao alterada:

1. atualizar metadados locais;
2. enfileirar indexacao/remocao;
3. atualizar arquivo/vector store na OpenAI se necessario;
4. registrar falha e estado de retry.

Mudanca de permissao e tao importante quanto mudanca de conteudo: um resultado antigo nao pode continuar disponivel para usuario que perdeu acesso.

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

Quando houver citacoes de conteudo, elas devem aparecer como metadados do bloco ou subitens controlados, nao como links markdown soltos. O clique principal deve abrir o arquivo real no Plan Things.

## Seguranca

- Nunca buscar arquivos fora do escopo autorizado do workspace.
- Nunca confiar em ids de arquivo vindos do modelo sem validar acesso.
- Nao expor ids de arquivo da OpenAI ao frontend, salvo se necessario.
- Evitar indexar arquivos sensiveis ou nao suportados ate existir politica clara.
- Tratar conteudo de arquivo como contexto nao confiavel para reduzir prompt injection.

## Definition of Done

- `file.search` roteia para capabilities locais de metadados e conteudo.
- Tabela de indexacao de arquivos existe.
- Busca respeita permissoes.
- Resultados de arquivo renderizam como blocos estruturados, nao apenas links markdown.
- Propostas de anexar arquivo exigem aprovacao do usuario.
