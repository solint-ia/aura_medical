# Aura Regenera — catálogo multilinhas

## Projeto

E-commerce B2B da Aura Regenera para profissionais. O catálogo reúne Pbserum e La Cutanée em Next.js 16 (App Router), React 19, TypeScript strict e Tailwind CSS v4.

## Comandos

- `npm run dev`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm test`
- `npm run db:seed`
- `npm run db:parity`
- `npm run storage:migrate`
- `npm run check:colors`

## Arquitetura do catálogo

- O Postgres é a fonte de verdade do catálogo publicado; os módulos em `src/data` alimentam somente o seed e páginas científicas legadas.
- `prisma/schema.prisma` define catálogo, conteúdo, mídia, redirects e auditoria; `prisma/seed.ts` é idempotente.
- `ClinicalCaseProduct` e `ClinicalCaseProtocol` ligam casos clínicos a múltiplos produtos/protocolos; todo caso publicado exige direito de imagem confirmado e ao menos um vínculo.
- `ProductImage` e `ProtocolImage` mantêm galerias ordenadas com legenda; a primeira imagem é a capa do produto.
- `src/server/catalog/repository.ts` concentra leituras e resolução de SKUs; componentes nunca consultam o Prisma diretamente.
- Imagens comerciais ficam no bucket Supabase Storage `Catalogo`; `MediaAsset` guarda caminho, metadados, tipo (`MediaCategory`) e marca para filtrar o acervo.
- `MediaAsset` também guarda o enquadramento (`fit`, `focalX`, `focalY`, `zoom`): o padrão preenche o espaço e o admin ajusta em `FramingEditor`. O site aplica o ajuste por `FramedImage`/`framingStyle`, e ele vale em todo lugar onde a foto aparece.
- `/admin/*` oferece listas e editores protegidos; toda rota `/api/admin/**` usa `requireAdmin`, Zod e auditoria nas mutações.
- `src/components/catalog/`: vitrine, filtros, card, detalhe e painel de compra.
- `SubNavBar` fixa as pílulas de seção abaixo do cabeçalho nas páginas longas (marca, ciência, detalhe). Ela mede cabeçalho e barra, publica `--anchor-offset` e só mostra seções que existem na página; toda seção alvo usa a classe `anchor-section`.
- O caminho acima do título vem da navegação real da aba (`navigationTrail`); `Breadcrumbs items` declara a hierarquia usada no JSON-LD e em quem chega direto por link.
- `/produtos/[slug]`: detalhes de produto.
- `/protocolos/[slug]`: detalhes de protocolo no mesmo sistema visual.
- `/linhas/[slug]`: página institucional e catálogo de cada marca.
- `/enzimas/[slug]`: redirect permanente para `/produtos/[slug]`.

Preços exibidos pelo cliente não são confiáveis. O checkout sempre resolve nome, preço e imagem pelo catálogo do servidor em `src/lib/checkoutPricing.ts`. Os IDs históricos `enz-slim`, `enz-smooth`, `enz-drain`, suas versões `-plus` e os IDs dos protocolos permanecem aceitos. As coberturas do Solary usam IDs separados.

## Regras visuais

- Fundo neutro porcelana `#EEF1F5`; navy e dourado identificam a Aura.
- Pbserum usa creme-dourado `#F5EEDC`; La Cutanée usa azul-gelo `#E7EEF8` e azul `#2B5C9E` dentro de seus componentes.
- Raios: seção 32px, card 24px, mídia 18px, ações e tags em pílula.
- Sora para display, Manrope para corpo e JetBrains Mono para rótulos técnicos.
- Headlines preferem peso 600. Cards não usam tags; o detalhe aceita no máximo duas tags informativas e sem emoji.
- Tema claro/escuro e `prefers-reduced-motion` devem continuar funcionando.

## Regras de negócio

- A Home contém Hero, até seis destaques e FAQ geral. O catálogo completo fica em `/catalogo`; preços não aparecem na vitrine.
- Compra existe somente no detalhe: “Comprar agora” adiciona o item e segue ao checkout; “Adicionar ao carrinho” permanece na página.
- Cartão de crédito permite até 12x, débito é sempre à vista e PIX tem 5% de desconto.
- Débito e crédito usam o mesmo formulário: o BIN consultado no Mercado Pago define o tipo e esconde o parcelamento.
- Protocolos conservam composição, sessões, reconstituição, marcação e resultados. O campo `application` não é exibido.
- Revytra C20+ Nano custa R$ 314,85.
- A grafia publicada é `Uvinul®`.
- A grafia publicada da marca é `Pbserum`; nomes de registro ANVISA mantêm a transcrição oficial.
- Protocolos descrevem o kit em ampolas no total (`src/lib/protocolVials.ts`); Celulite é a exceção por região.
- Informações La Cutanée não recebidas do fornecedor aparecem como “Ficha técnica em confirmação”; dados internos pendentes ficam apenas no módulo de dados.
- Antes de acusar falha ao salvar, os editores do admin releem o registro (`matchesSaved`): resposta perdida ou conflito com a própria gravação anterior contam como salvo.
- O frete envia ao Melhor Envio as medidas de uma unidade e a quantidade; sem peso e dimensões cadastrados, usa a embalagem padrão de 10 × 15 × 20 cm e 0,5 kg.

## Conteúdo legado

`enzymes.ts`, `protocols.ts`, `products.ts` e `cases.ts` continuam como fontes do seed e da página científica `/enzimas`. Casos clínicos públicos aparecem dentro dos produtos e protocolos vinculados. `/casos-clinicos` e `/linhas/[slug]/casos-clinicos` são redirects permanentes para a marca correspondente.
