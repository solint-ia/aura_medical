# Aura Regenera — catálogo multilinhas

## Projeto

E-commerce B2B da Aura Regenera para profissionais. O catálogo reúne PBSerum e La Cutanée em Next.js 16 (App Router), React 19, TypeScript strict e Tailwind CSS v4.

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
- `src/server/catalog/repository.ts` concentra leituras e resolução de SKUs; componentes nunca consultam o Prisma diretamente.
- Imagens comerciais ficam no bucket Supabase Storage `Catalogo`; `MediaAsset` guarda caminho e metadados.
- `/admin/*` oferece listas e editores protegidos; toda rota `/api/admin/**` usa `requireAdmin`, Zod e auditoria nas mutações.
- `src/components/catalog/`: vitrine, filtros, card, detalhe e painel de compra.
- `/produtos/[slug]`: detalhes de produto.
- `/protocolos/[slug]`: detalhes de protocolo no mesmo sistema visual.
- `/linhas/[slug]`: página institucional e catálogo de cada marca.
- `/enzimas/[slug]`: redirect permanente para `/produtos/[slug]`.

Preços exibidos pelo cliente não são confiáveis. O checkout sempre resolve nome, preço e imagem pelo catálogo do servidor em `src/lib/checkoutPricing.ts`. Os IDs históricos `enz-slim`, `enz-smooth`, `enz-drain`, suas versões `-plus` e os IDs dos protocolos permanecem aceitos. As coberturas do Solary usam IDs separados.

## Regras visuais

- Fundo neutro porcelana `#EEF1F5`; navy e dourado identificam a Aura.
- PBSerum usa creme-dourado `#F5EEDC`; La Cutanée usa azul-gelo `#E7EEF8` e azul `#2B5C9E` dentro de seus componentes.
- Raios: seção 32px, card 24px, mídia 18px, ações e tags em pílula.
- Sora para display, Manrope para corpo e JetBrains Mono para rótulos técnicos.
- Headlines preferem peso 600. Cards não usam tags; o detalhe aceita no máximo duas tags informativas e sem emoji.
- Tema claro/escuro e `prefers-reduced-motion` devem continuar funcionando.

## Regras de negócio

- A Home contém Hero, até seis destaques e FAQ geral. O catálogo completo fica em `/catalogo`; preços não aparecem na vitrine.
- Compra existe somente no detalhe: “Comprar agora” adiciona o item e segue ao checkout; “Adicionar ao carrinho” permanece na página.
- Cartão permite até 10x e PIX tem 5% de desconto.
- Protocolos conservam composição, sessões, reconstituição, marcação e resultados. O campo `application` não é exibido.
- Revytra C20+ Nano custa R$ 314,85.
- A grafia publicada é `Uvinul®`.
- Informações La Cutanée não recebidas do fornecedor aparecem como “Ficha técnica em confirmação”; dados internos pendentes ficam apenas no módulo de dados.
- Até chegarem dimensões reais, o frete usa a embalagem padrão de 10 × 15 × 20 cm e 0,5 kg.

## Conteúdo legado

`enzymes.ts`, `protocols.ts`, `products.ts` e `cases.ts` continuam como fontes do seed e da página científica `/enzimas`. Casos clínicos públicos ficam em `/linhas/[slug]/casos-clinicos`; `/casos-clinicos` é um redirect permanente para PBSerum.
