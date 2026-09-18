# Plano: painel de administração completo + fotos e antes/depois nas páginas de produto

> Escrito para: equipe/agente que for implementar (Codex ou humano), a partir do pedido do administrador da Aura Regenera.
> Data: 2026-09-16 (branch `refactor/site-redesign`).

---

## Decisões já tomadas pelo administrador

1. **Todo caso clínico** vai estar associado a **um ou mais produtos** e/ou **um ou mais protocolos**. Não existe caso "solto" ligado só a uma marca.
2. O conteúdo de antes/depois deixa de ter página própria (`/casos-clinicos`) e passa a viver **dentro da página de cada produto/protocolo associado**. Se um caso está ligado a dois produtos, ele aparece nos dois.
3. Formato visual do antes/depois: **duas fotos lado a lado** (mantém o padrão visual atual, só muda o lugar onde aparece).
4. `/admin/casos` (a tela do painel, não a pública) **continua existindo**, como lista central de auditoria de direito de imagem — mostra todos os casos, quem autorizou o uso da foto e quais estão publicados sem confirmação. A edição do conteúdo em si (fotos, textos) acontece de dentro do produto/protocolo; essa lista é só para conferência e para achar um caso rapidamente.

---

# PARTE 1 — Diagnóstico do que existe hoje

## 1.1 O painel é uma casca vazia

O admin tem 13 páginas. Doze delas são arquivos de **duas linhas de código** — não têm tela própria, só chamam um de dois componentes genéricos.

**Componente 1 — tabela genérica** (`src/components/admin/AdminResourceList.tsx`)
Tabela de três colunas: nome, status, link "Editar". Usada para produtos, protocolos, casos, mídia, clientes, pedidos — tudo igual. Sem busca, sem filtro, sem foto, sem publicar/arquivar/excluir.

**Componente 2 — caixa de texto com JSON** (`src/components/admin/AdminJsonEditor.tsx`)
Pega o registro do banco, transforma em texto JSON dentro de uma `<textarea>`, e a pessoa edita o texto na mão. É assim que hoje se edita **marca/linha, categoria, protocolo e caso clínico**. É a tela que motivou este pedido.

A exceção é o formulário de produto (`src/components/admin/ProductAdminForm.tsx`), que é um formulário de verdade mas cobre só ~12 dos ~25 campos do produto. Não dá para mexer em fotos, descrições, preços, SKUs, ficha técnica, peso/dimensões ou dados da ANVISA por ali.

> ### ⚠️ Bug ativo apagando dados em produção
> Em `src/components/admin/ProductAdminForm.tsx` (linha ~133), o código sempre envia a ficha técnica vazia (`specs: []`) ao salvar um produto.
> **Toda edição de produto por esse formulário apaga a ficha técnica do banco.** É o item mais urgente do plano — vale corrigir isoladamente, hoje, independente do resto.

## 1.2 Faltam as rotas de API por trás de metade das telas

O painel não fala direto com o banco — ele chama endereços no servidor ("rotas de API") que leem e gravam os dados. Sem a rota, não tem como fazer a tela, por mais bonita que seja.

| O que falta editar | Rota existe? |
|---|---|
| Descrição, "como usar", benefícios do produto | ❌ Não existe |
| Galeria de fotos do produto | ❌ Não existe |
| Aviso "Ficha técnica em confirmação" | ❌ Não existe |
| Fotos e preços de protocolo | ❌ Não existe |
| Publicar/arquivar protocolo, caso ou marca | ❌ Não existe |
| Excluir produto, protocolo ou caso | ❌ Não existe |
| Logo, imagem de destaque e banner da marca | ❌ Não existe |
| Apelidos de SKU (`enz-slim` e afins) | ❌ Não existe |
| Produto (criar, editar, publicar, arquivar) | ✅ Existe |
| Marca, categoria, protocolo, caso (criar e editar) | ✅ Existe, mas sem publicar/excluir |

Trava contra edição simultânea (quando duas pessoas editam o mesmo registro ao mesmo tempo): só existe no `PATCH` de produto. Nas marcas, categorias, protocolos e casos, quem salvar por último apaga o trabalho do outro sem aviso.

## 1.3 Casos clínicos hoje

- `ClinicalCase` tem hoje: `lineId` (obrigatório) e `protocolId` (opcional, um só). **Não existe ligação com produto**, e não existe ligação com mais de um protocolo.
- Aparecem numa página própria, `/linhas/[slug]/casos-clinicos`, filtrável por categoria.
- A galeria de fotos do produto (`ProductImage`) **já existe no banco e no seed**, mas o código do site (`src/server/catalog/mappers.ts`, linha ~63) usa só a primeira foto. Metade do trabalho da galeria já está pronto e invisível.
- O protocolo **não tem** tabela de galeria — só imagem de capa e imagem de mapeamento.

---

# PARTE 2 — O que vamos construir

## Etapa 1 — Banco de dados

**Nova tabela `ClinicalCaseProduct`** (liga caso a produto, N-para-N):
```
caseId, productId, sortOrder
```

**Nova tabela `ClinicalCaseProtocol`** (liga caso a protocolo, N-para-N — substitui o campo único `protocolId` de hoje):
```
caseId, protocolId, sortOrder
```

**Nova tabela `ProtocolImage`** (galeria do protocolo, espelha a `ProductImage` que já existe):
```
protocolId, assetId, caption, sortOrder
```

**`ProductImage`**: adicionar campo `caption` (legenda opcional por foto).

**`ClinicalCase`**: remover o campo único `protocolId`; `lineId` deixa de ser escolhido manualmente e passa a ser **calculado automaticamente** a partir dos produtos/protocolos vinculados (serve só para filtros internos e relatórios, não é mais uma decisão da pessoa que cadastra).

**Validação obrigatória**: um caso só pode ser salvo como publicado se tiver **pelo menos um** produto ou protocolo vinculado.

**Corrigir o bug do `specs: []`** — remover a linha que zera a ficha técnica.

**Criar uma função única de trava de edição simultânea**, usada por todas as rotas de salvar, para avisar "esse registro mudou desde que você abriu" em vez de sobrescrever silenciosamente.

## Etapa 2 — Rotas de API que faltam

Criar todas as rotas marcadas com ❌ na tabela da seção 1.2, seguindo o padrão que o projeto já usa (conferir se é admin → validar dados → gravar → registrar na auditoria).

**Regras para publicar (hoje quase não existem):**

- **Produto** — já exige nome, resumo, apresentação, uma foto e um preço ativo. Adicionar: a marca precisa estar publicada; no máximo 2 destaques, sem emoji.
- **Protocolo** — exigir ao menos um produto na composição, sessões, frequência, foto de capa e um preço ativo.
- **Caso clínico** — exigir confirmação de direito de imagem marcada **e** pelo menos um produto ou protocolo vinculado. Hoje o campo de confirmação existe no banco e ninguém confere ele — é o maior risco jurídico desta mudança, porque a nova tela vai dar muito mais destaque a essas fotos.
- **Marca/linha** — endereço (slug) único e as seis cores preenchidas corretamente.

**Regras para excluir:**

- Produto já vendido não pode ser apagado (quebraria o histórico de pedidos) — o sistema sugere arquivar em vez de excluir.
- Apelido de SKU em uso não pode ser apagado. Os IDs antigos (`enz-slim`, `enz-smooth`, `enz-drain` e as versões `-plus`) continuam valendo no checkout; apagar um deles quebra carrinho ou link antigo de cliente.
- Produto ou protocolo com casos vinculados: ao excluir, o sistema avisa quantos casos ficariam sem esse vínculo (e bloqueia se for o único vínculo do caso).

## Etapa 3 — Deixar o painel parecer um painel

**Trocar a barra de botões no topo por um menu lateral** (fixo no computador, gaveta no celular), organizado em três grupos:

- **Catálogo** — Marcas, Categorias, Produtos, Protocolos, Preços
- **Conteúdo** — Blocos da home, FAQ, Avisos de segurança, Mídia
- **Operação** — Pedidos, Clientes, Auditoria de direito de imagem, Auditoria geral, Testes

**Criar as peças reutilizáveis** que hoje não existem: campo de texto, seletor, liga/desliga, seletor de cor, lista arrastável de itens, seletor de imagem com biblioteca de mídia, seletor múltiplo de produtos/protocolos (para ligar casos), selo de status, barra de salvar fixa (mostrando "não salvo" / "salvando" / "alguém editou antes de você") e uma tabela de verdade com busca, filtro, ordenação e paginação.

**Limpar a visão geral** — `src/app/admin/page.tsx` tem 1480 linhas e ainda renderiza o cabeçalho e o rodapé do site público dentro do painel, duplicando tudo na tela. Quebrar em componentes menores e remover esse cabeçalho/rodapé duplicado.

Manter as regras visuais do `CLAUDE.md`: fundo porcelana, navy e dourado, raios de borda por tipo de elemento, as três fontes do projeto, tema claro/escuro, e rodar `npm run check:colors` ao final.

## Etapa 4 — As telas de edição, uma por recurso

Cada tela vira um formulário com abas. A caixa de JSON desaparece (pode sobrar, no máximo, como aba escondida de depuração).

### Marca / linha

| Aba | Conteúdo |
|---|---|
| Identidade | Nome, endereço (slug), descritor, frase de apresentação |
| Cores | Os 6 seletores de cor, com prévia ao vivo do card e do hero, em claro e escuro |
| Institucional | Missão, visão, valores, diferenciais, compromissos |
| Mídia | Logo, imagem de destaque, banner |
| Publicação | Status, ordem, visualizar antes de publicar, publicar/arquivar |

### Categorias

Uma tela só, agrupada por marca, com arrastar para reordenar e contador de produtos. Bloqueia exclusão de categoria com produtos dentro.

### Produtos

| Aba | Conteúdo |
|---|---|
| **Básico** | Marca, categoria, nome, endereço, chapéu, coleção, resumo, apresentação, conteúdo líquido, destaques (máx. 2) |
| **Descrições** | Aqui ficam **descrição, como usar e benefícios** — lista de blocos "título + texto + itens", adicionável/reordenável, com sugestões de título: Mecanismo de ação, Indicações, Como usar, Benefícios, Tecnologia, Registro ANVISA |
| **Ficha técnica** | Pares rótulo/valor, nome e número do registro, peso e dimensões (com lembrete do padrão 10 × 15 × 20 cm / 0,5 kg), e os avisos "Ficha técnica em confirmação" |
| **Galeria** | Envio de várias fotos, arrastar para ordenar, primeira foto = capa, legenda e texto alternativo por foto |
| **Preços** | Tabela de SKUs (código, rótulo, preço, foto, estoque, ativo) e apelidos históricos, com prévia de 12x no cartão e −5% no PIX |
| **Antes e depois** | Os casos clínicos vinculados a este produto — criar, editar e desvincular ali mesmo. Um caso pode estar vinculado a outros produtos/protocolos também; a tela mostra esses outros vínculos |
| **Publicação** | Status, destaque na home + ordem, visibilidade, visualizar, publicar/arquivar |

### Protocolos

Mesmas abas do produto, com duas trocas: no lugar de "Ficha técnica" entra **Clínico** (indicações, sessões, frequência, reconstituição, marcação, resultados esperados, nota); e entra **Composição** (quais produtos compõem o protocolo, quantidade de ampolas, função de cada um, com busca). O campo `application` fica editável com aviso "não aparece no site", conforme a regra do `CLAUDE.md`.

### Casos clínicos

**Criação e edição do conteúdo** acontecem de dentro do produto ou do protocolo (aba "Antes e depois"), nunca mais numa tela separada de cadastro.

**`/admin/casos`** vira uma lista central só de consulta e auditoria: todos os casos, quais produtos/protocolos cada um toca, status de confirmação de direito de imagem, e um alerta destacado para qualquer caso publicado sem essa confirmação. Cada linha da lista tem um link que leva direto para a aba "Antes e depois" do produto/protocolo dono daquele caso.

### Mídia

Grade com miniaturas, busca, envio arrastando o arquivo, edição do texto alternativo. Ao tentar excluir uma imagem em uso, o sistema mostra **onde** ela está sendo usada (hoje só devolve um erro seco).

## Etapa 5 — Fotos e antes/depois na página pública do produto/protocolo

**Na página individual de produto e de protocolo:**

1. A foto principal vira uma **galeria**: miniaturas ao lado, navegação por teclado, arrastar no celular, respeitando quem desliga animações no aparelho.
2. Nova seção, **"Antes e depois"**, logo depois das descrições e antes de "Continue explorando": cada caso vinculado àquele produto/protocolo aparece com as duas fotos lado a lado, número de sessões, profissional responsável e país — mantendo o botão de credenciamento que hoje existe no rodapé de cada caso.
3. Se o caso também está vinculado a outro produto/protocolo, a seção mostra um link "Ver também em [nome]" — assim o mesmo caso pode ser mostrado em vários lugares sem duplicar o cadastro.

**Desmontando a seção antiga:**

- Apagar as páginas `/linhas/[slug]/casos-clinicos` e `/casos-clinicos`
- Criar redirecionamento permanente das duas para a página da marca correspondente (preserva SEO)
- Remover os links que apontam para lá em `src/app/linhas/[slug]/page.tsx` (linha ~35) e `src/data/lines.ts` (linha ~34)
- Aposentar o componente `CasosClinicosGallery` e a função `getCasesByLine`

> ### ⚠️ Ordem de execução importa
> Como todo caso agora **precisa** ter produto ou protocolo vinculado (decisão já tomada), rodar antes um script de migração que:
> 1. Para cada caso existente com `protocolId` preenchido, cria a ligação correspondente na nova tabela `ClinicalCaseProtocol`.
> 2. Lista os casos que não têm protocolo nenhum (hoje ligados só à linha) para o administrador decidir manualmente a qual produto ou protocolo cada um pertence, **antes** de apagar as páginas antigas — senão esse conteúdo some do site sem aviso.

## Etapa 6 — Conferência final

- Testes automatizados: regras de publicação, mapeamento da galeria, casos aparecendo nos produtos/protocolos certos (inclusive quando vinculados a mais de um), checkout continuando a reconhecer os IDs antigos de SKU, bloqueio de acesso sem permissão, aviso de edição simultânea.
- Rodar: `npx tsc --noEmit`, `npm run lint`, `npm run check:colors`, `npm test`, `npm run build`.
- Atualizar `prisma/seed.ts` com as tabelas novas (`ClinicalCaseProduct`, `ClinicalCaseProtocol`, `ProtocolImage`, legendas), depois `npm run db:seed` e `npm run db:parity`.
- Atualizar o `CLAUDE.md`: casos clínicos deixam de ter rota própria; anotar as novas tabelas na arquitetura do catálogo.

---

# PARTE 3 — Ordem de entrega

| # | Entrega | Depende de |
|---|---|---|
| 1 | Banco de dados + correção do bug do `specs` | — |
| 2 | Rotas de API que faltam + testes | 1 |
| 3 | Menu lateral + peças reutilizáveis do painel | — (pode ser em paralelo com a 2) |
| 4 | Telas: marcas → categorias → produtos → protocolos → casos (auditoria) → mídia | 2 e 3 |
| 5 | Script de migração de casos antigos → galeria e antes/depois no site → remoção das páginas antigas | 4 |
| 6 | Seed, verificação e documentação | 5 |

---

# PARTE 4 — Riscos

1. **Ficha técnica sendo apagada agora**, a cada edição de produto pelo formulário atual. Corrigir isso não depende do resto do plano.
2. **Apagar um apelido de SKU quebra o checkout** de quem tem link ou carrinho salvo com o ID antigo.
3. **Direito de imagem** — a nova tela dá muito mais destaque às fotos de pacientes; a trava de autorização e a lista de auditoria precisam entrar junto com as telas novas, não depois.
4. **Casos órfãos somem do site** se as páginas antigas forem apagadas antes de vincular todos os casos existentes a pelo menos um produto ou protocolo.
5. `/admin` hoje é protegido só no navegador (`AdminGuard.tsx`); as rotas de API estão corretamente protegidas no servidor (`requireAdmin`), então não há vazamento de dado — mas uma trava também no servidor seria mais segura. Depende de mudar como o login guarda o token (hoje não usa cookie protegido), o que fica fora do escopo deste plano.

---

# PARTE 5 — Próximo passo sugerido

Começar pela Etapa 1 (banco de dados), incluindo a correção do bug do `specs: []` isoladamente e o mais rápido possível, já que ela está causando perda de dado em produção agora.
