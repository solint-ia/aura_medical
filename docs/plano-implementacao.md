# Catálogo Dinâmico Aura Regenera — plano de implementação

Base verificada em 14/09/2026 · branch `main` · 33 arquivos com alterações não commitadas · `npx tsc --noEmit` passa · `npx eslint src` falha com 15 erros e 41 avisos (pré-existentes).

Legenda de arquivos: **C** criar · **E** editar · **R** remover.

---

## 1. Achados que mudam o plano

| # | Severidade | Achado | Evidência | Impacto |
|---|---|---|---|---|
| A1 | Crítico | `/api/admin/orders` (GET, PUT, DELETE) e `/api/admin/stats` não verificam autenticação | `src/app/api/admin/orders/route.ts:42,171,258` · `src/app/api/admin/stats/route.ts:14` | Qualquer pessoa lista nome, e-mail, telefone e endereço de clientes, altera status (dispara e-mail de rastreio) e exclui pedidos |
| A2 | Crítico | Segredo JWT com fallback fixo, reaproveitando a service role key | `src/lib/auth.ts:3` | Sem a variável de ambiente, qualquer um assina um token com `role: "ADMIN"` |
| A3 | Crítico | Senha do Postgres no código e no histórico git | `src/lib/prisma.ts:10` · `src/lib/db.ts:5` · `scripts/run_migration.js:3` · commits `b1f508e`, `a07cad9`, `4636377` | Credencial comprometida: rotacionar |
| A4 | Alto | Papel ADMIN gravado no token por 30 dias | `src/app/api/auth/login/route.ts:230-239` | Admin rebaixado mantém acesso |
| A5 | Alto | Painel protegido só no cliente, com regra `email.includes("admin")` | `src/app/admin/page.tsx:182-186` | Qualquer e-mail contendo "admin" vê a interface |
| A6 | Alto | Não existe `prisma/migrations`; tabelas criadas por SQL avulso | `scripts/run_migration.js` | Baseline obrigatório antes de migrar |
| A7 | Médio | Subtotal não acompanha a quantidade | `src/components/catalog/PurchasePanel.tsx:52` exibe `offer.price` | Requisito P4.2 confirmado |
| A8 | Médio | Carrinho soma adições sem teto; servidor recusa acima de 20 | `src/context/CartContext.tsx:87` × `src/lib/checkoutPricing.ts:9` | Erro só aparece no pagamento |
| A9 | Médio | Frascos La Cutanée ocupam ~17% da largura de PNGs transparentes de 2666×1756 | `public/images/products/la-cutanee/*.png` | Causa real da foto pequena; o fundo "duro" vem do container (`CatalogCard.tsx:15`), não da imagem |
| A10 | Baixo | Emoji fora de tag no menu de linhas | `src/components/layout/SiteHeader.tsx:35,56` | Viola a regra visual do CLAUDE.md |

---

## 2. Arquitetura de dados

### 2.1 Decisões

1. **Postgres é a fonte da verdade; os arquivos TS viram seed.** `enzymes.ts`, `protocols.ts`, `la-cutanee.ts`, `pbserum.ts`, `lines.ts`, `cases.ts` e `safety.ts` alimentam `prisma/seed.ts`. Depois da troca, dados comerciais (nome, preço, imagem, composição) deixam de ser importados em runtime.
2. **SKU é a identidade comercial.** Tudo que se compra (ampola, variação de cobertura, kit de protocolo) é uma linha de `Sku` com `code` imutável. O `code` é o mesmo `id` já salvo nos carrinhos: `enz-slim-plus`, `queixo-duplo`, `solary-aox-fps-60-com-cor`. Aliases históricos (`enz-slim` → `enz-slim-plus`) ficam em `SkuAlias`.
3. **Pedidos antigos não dependem do catálogo.** `OrderItem` já guarda `productId`, `productName`, `unitPrice` e `imagePath`. Nenhuma FK nova é criada em `order_items`; o histórico permanece íntegro com produto arquivado.
4. **Checkout lê direto do banco, sem cache, e falha fechado.** Banco indisponível resulta em 503. Não há fallback para preço do cliente nem para arquivo estático.
5. **Vitrine lê com cache por tag** (`catalog`, `line:<slug>`, `product:<slug>`). Mutações do admin chamam `revalidateTag(tag, "max")` — assinatura do Next 16.2 instalado; `updateTag` só existe em Server Actions. Conferir `node_modules/next/dist/docs` antes de escolher entre `unstable_cache` e `'use cache'` + `cacheTag`.
6. **Admin via Route Handlers com Bearer**, coerente com o código atual: o token vive no `localStorage`, então Server Actions não o leriam. Cookie httpOnly fica recomendado na Fase 0.
7. **Uploads no Supabase Storage com URL assinada.** O navegador envia direto ao bucket, contornando o limite de 4,5 MB de corpo das funções da Vercel. Fotos clínicas são reprocessadas no servidor para remover EXIF/GPS.
8. **Validação única com Zod** em `src/lib/validation/`, compartilhada entre formulário e rota. Novas dependências: `zod`, `sharp` (explícita), `vitest`, `@testing-library/react`, `jsdom`, `tsx`.
9. **Rascunho e publicação.** Nada aparece no site antes de publicado. Pré-visualização por token curto + `draftMode()`.

### 2.2 Schema Prisma proposto

Convenções do schema atual mantidas: UUID, `@map` snake_case, `Timestamptz`, dinheiro em `Decimal(10,2)`. Os modelos existentes (`UserProfile`, `UserAddress`, `Order`, `OrderItem`) não mudam.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooler
  directUrl = env("DIRECT_URL")     // conexão direta, usada por migrate
}

enum PublishStatus { DRAFT PUBLISHED ARCHIVED }
enum Visibility    { PUBLIC INTERNAL }        // INTERNAL = kits de teste de pagamento
enum MediaProvider { LOCAL SUPABASE }         // LOCAL = arquivo já em /public
enum LineMediaRole { LOGO HERO BANNER }
enum FaqScope      { GLOBAL LINE }

model Line {
  id            String        @id @default(uuid()) @db.Uuid
  slug          String        @unique @db.VarChar(80)
  name          String        @db.VarChar(120)
  descriptor    String        @db.VarChar(160)
  tagline       String        @db.Text
  surfaceLight  String        @map("surface_light") @db.VarChar(9)   // #F5EEDC
  surfaceDark   String        @map("surface_dark") @db.VarChar(9)    // #1F1A12
  accentLight   String        @map("accent_light") @db.VarChar(9)    // #B4872D
  accentDark    String        @map("accent_dark") @db.VarChar(9)     // #D8B657
  inkLight      String        @map("ink_light") @db.VarChar(9)       // #12283C
  inkDark       String        @map("ink_dark") @db.VarChar(9)        // #F7F5F0
  mission       String?       @db.Text
  vision        String?       @db.Text
  values        String?       @db.Text
  differentials String[]
  commitments   String[]                                             // antigo `seals`
  status        PublishStatus @default(DRAFT)                        // ARCHIVED = desativada
  sortOrder     Int           @default(0) @map("sort_order")
  createdAt     DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime      @updatedAt @map("updated_at") @db.Timestamptz
  media         LineMedia[]
  categories    Category[]
  products      Product[]
  protocols     Protocol[]
  cases         ClinicalCase[]
  faqs          FaqItem[]
  safetyNotes   SafetyNote[]
  blocks        ContentBlock[]

  @@map("catalog_lines")
}

model LineMedia {
  lineId    String        @map("line_id") @db.Uuid
  assetId   String        @map("asset_id") @db.Uuid
  role      LineMediaRole
  sortOrder Int           @default(0) @map("sort_order")
  line      Line          @relation(fields: [lineId], references: [id], onDelete: Cascade)
  asset     MediaAsset    @relation(fields: [assetId], references: [id], onDelete: Restrict)

  @@id([lineId, assetId, role])
  @@map("catalog_line_media")
}

model Category {
  id        String    @id @default(uuid()) @db.Uuid
  lineId    String?   @map("line_id") @db.Uuid     // null = transversal
  slug      String    @unique @db.VarChar(80)
  name      String    @db.VarChar(80)              // "Sérum facial", "Proteção solar"
  sortOrder Int       @default(0) @map("sort_order")
  line      Line?     @relation(fields: [lineId], references: [id])
  products  Product[]

  @@map("catalog_categories")
}

model Product {
  id               String        @id @default(uuid()) @db.Uuid
  lineId           String        @map("line_id") @db.Uuid
  categoryId       String?       @map("category_id") @db.Uuid
  slug             String        @unique @db.VarChar(120)
  name             String        @db.VarChar(160)
  eyebrow          String        @db.VarChar(160)  // "Sérum facial reparador e anti-idade"
  collection       String?       @db.VarChar(80)   // "La Cutanée.MED"
  summary          String        @db.Text
  presentation     String        @db.VarChar(160)  // "Frasco conta-gotas de 30 ml"
  netContent       String?       @map("net_content") @db.VarChar(40)   // "30 ml", "130 g"
  highlights       String[]                        // máx. 2, sem emoji (Zod)
  variantName      String?       @map("variant_name") @db.VarChar(40)  // "Cobertura"
  specs            Json          @default("[]")    // [{ label: "Ativo", value: "Lipase PB500" }]
  regulatoryName   String?       @map("regulatory_name") @db.VarChar(160)
  regulatoryNumber String?       @map("regulatory_number") @db.VarChar(60)
  weightGrams      Int?          @map("weight_grams")     // null = embalagem padrão 0,5 kg
  lengthCm         Decimal?      @map("length_cm") @db.Decimal(6, 1)
  widthCm          Decimal?      @map("width_cm") @db.Decimal(6, 1)
  heightCm         Decimal?      @map("height_cm") @db.Decimal(6, 1)
  status           PublishStatus @default(DRAFT)
  visibility       Visibility    @default(PUBLIC)
  featured         Boolean       @default(false)
  featuredOrder    Int?          @map("featured_order")
  sortOrder        Int           @default(0) @map("sort_order")
  publishedAt      DateTime?     @map("published_at") @db.Timestamptz
  createdAt        DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime      @updatedAt @map("updated_at") @db.Timestamptz
  line             Line          @relation(fields: [lineId], references: [id])
  category         Category?     @relation(fields: [categoryId], references: [id])
  images           ProductImage[]
  sections         ProductSection[]
  pending          PendingField[]
  skus             Sku[]
  protocolUses     ProtocolComponent[]

  @@index([lineId, status])
  @@index([featured, featuredOrder])
  @@map("catalog_products")
}

model ProductImage {
  productId String     @map("product_id") @db.Uuid
  assetId   String     @map("asset_id") @db.Uuid
  sortOrder Int        @default(0) @map("sort_order")
  product   Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  asset     MediaAsset @relation(fields: [assetId], references: [id], onDelete: Restrict)

  @@id([productId, assetId])
  @@map("catalog_product_images")
}

model ProductSection {
  id        String   @id @default(uuid()) @db.Uuid
  productId String   @map("product_id") @db.Uuid
  title     String   @db.VarChar(80)               // Tecnologia, Ativos, Benefícios, Indicação
  body      String?  @db.Text
  items     String[]
  sortOrder Int      @default(0) @map("sort_order")
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("catalog_product_sections")
}

model PendingField {
  id         String    @id @default(uuid()) @db.Uuid
  productId  String    @map("product_id") @db.Uuid
  label      String    @db.VarChar(120)            // "Lista INCI completa"
  isPublic   Boolean   @default(true) @map("is_public")
  resolvedAt DateTime? @map("resolved_at") @db.Timestamptz
  product    Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("catalog_pending_fields")
}

model Sku {
  id            String      @id @default(uuid()) @db.Uuid
  code          String      @unique @db.VarChar(100)  // = id do carrinho = OrderItem.productId
  productId     String?     @map("product_id") @db.Uuid
  protocolId    String?     @map("protocol_id") @db.Uuid
  label         String?     @db.VarChar(60)           // "Com cor"
  price         Decimal     @db.Decimal(10, 2)
  imageId       String?     @map("image_id") @db.Uuid
  trackStock    Boolean     @default(false) @map("track_stock")
  stockQuantity Int?        @map("stock_quantity")
  isActive      Boolean     @default(true) @map("is_active")
  sortOrder     Int         @default(0) @map("sort_order")
  createdAt     DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime    @updatedAt @map("updated_at") @db.Timestamptz
  product       Product?    @relation(fields: [productId], references: [id])
  protocol      Protocol?   @relation(fields: [protocolId], references: [id])
  image         MediaAsset? @relation(fields: [imageId], references: [id])
  aliases       SkuAlias[]

  @@map("catalog_skus")
  // migration.sql:
  //   CHECK ((product_id IS NULL) <> (protocol_id IS NULL))
  //   CHECK (price >= 0)
  //   CHECK (stock_quantity IS NULL OR stock_quantity >= 0)
}

model SkuAlias {
  alias String @id @db.VarChar(100)                  // "enz-slim"
  skuId String @map("sku_id") @db.Uuid
  sku   Sku    @relation(fields: [skuId], references: [id], onDelete: Restrict)

  @@map("catalog_sku_aliases")
}

model Protocol {
  id              String        @id @default(uuid()) @db.Uuid
  lineId          String        @map("line_id") @db.Uuid
  slug            String        @unique @db.VarChar(120)
  name            String        @db.VarChar(160)
  introduction    String        @db.Text
  note            String?       @db.Text           // "Tratamento para ambas as pernas"
  indications     String[]
  sessions        String        @db.VarChar(40)    // "2-4"
  frequency       String        @db.VarChar(60)    // "A cada 2 semanas"
  reconstitution  String[]
  application     String[]                         // mantido no banco, não exibido
  marking         String        @db.Text
  expectedResults String[]      @map("expected_results")
  coverImageId    String?       @map("cover_image_id") @db.Uuid
  mappingImageId  String?       @map("mapping_image_id") @db.Uuid
  status          PublishStatus @default(DRAFT)
  visibility      Visibility    @default(PUBLIC)
  sortOrder       Int           @default(0) @map("sort_order")
  createdAt       DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime      @updatedAt @map("updated_at") @db.Timestamptz
  line            Line          @relation(fields: [lineId], references: [id])
  coverImage      MediaAsset?   @relation("ProtocolCover", fields: [coverImageId], references: [id])
  mappingImage    MediaAsset?   @relation("ProtocolMapping", fields: [mappingImageId], references: [id])
  components      ProtocolComponent[]
  skus            Sku[]
  cases           ClinicalCase[]

  @@map("catalog_protocols")
}

model ProtocolComponent {
  id         String   @id @default(uuid()) @db.Uuid
  protocolId String   @map("protocol_id") @db.Uuid
  productId  String   @map("product_id") @db.Uuid
  quantity   Int                                    // ampolas
  role       String   @db.Text                      // "Remodelação do colágeno"
  sortOrder  Int      @default(0) @map("sort_order")
  protocol   Protocol @relation(fields: [protocolId], references: [id], onDelete: Cascade)
  product    Product  @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@unique([protocolId, productId])
  @@map("catalog_protocol_components")
}

model ClinicalCase {
  id                   String        @id @default(uuid()) @db.Uuid
  lineId               String        @map("line_id") @db.Uuid
  protocolId           String?       @map("protocol_id") @db.Uuid
  slug                 String        @unique @db.VarChar(120)
  title                String        @db.VarChar(160)
  description          String?       @db.Text
  professional         String        @db.VarChar(160)   // "Equipe Médica pbserum"
  country              String?       @db.VarChar(60)
  sessions             Int
  parameters           Json          @default("[]")     // [{ label: "Intervalo", value: "14 dias" }]
  beforeImageId        String        @map("before_image_id") @db.Uuid
  afterImageId         String        @map("after_image_id") @db.Uuid
  imageRightsConfirmed Boolean       @default(false) @map("image_rights_confirmed")
  imageRightsNote      String?       @map("image_rights_note") @db.Text
  status               PublishStatus @default(DRAFT)
  sortOrder            Int           @default(0) @map("sort_order")
  createdAt            DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime      @updatedAt @map("updated_at") @db.Timestamptz
  line                 Line          @relation(fields: [lineId], references: [id])
  protocol             Protocol?     @relation(fields: [protocolId], references: [id])
  beforeImage          MediaAsset    @relation("CaseBefore", fields: [beforeImageId], references: [id])
  afterImage           MediaAsset    @relation("CaseAfter", fields: [afterImageId], references: [id])

  @@map("catalog_clinical_cases")
  // migration.sql: CHECK (status <> 'PUBLISHED' OR image_rights_confirmed)
}

model FaqItem {
  id          String   @id @default(uuid()) @db.Uuid
  scope       FaqScope @default(GLOBAL)
  lineId      String?  @map("line_id") @db.Uuid
  question    String   @db.Text
  answer      String   @db.Text
  links       Json     @default("[]")
  isPublished Boolean  @default(false) @map("is_published")
  sortOrder   Int      @default(0) @map("sort_order")
  line        Line?    @relation(fields: [lineId], references: [id])

  @@map("content_faq_items")
  // migration.sql: CHECK ((scope = 'GLOBAL') = (line_id IS NULL))
}

model SafetyNote {
  id          String  @id @default(uuid()) @db.Uuid
  lineId      String? @map("line_id") @db.Uuid
  label       String  @db.VarChar(120)
  body        String  @db.Text
  isPublished Boolean @default(false) @map("is_published")
  sortOrder   Int     @default(0) @map("sort_order")
  line        Line?   @relation(fields: [lineId], references: [id])

  @@map("content_safety_notes")
}

model ContentBlock {
  id          String  @id @default(uuid()) @db.Uuid
  key         String  @unique @db.VarChar(100)      // "home.hero", "line.pbserum.science-links"
  lineId      String? @map("line_id") @db.Uuid
  eyebrow     String? @db.VarChar(120)
  title       String? @db.Text
  body        String? @db.Text
  items       Json    @default("[]")
  ctaLabel    String? @map("cta_label") @db.VarChar(60)
  ctaHref     String? @map("cta_href") @db.VarChar(300)
  isPublished Boolean @default(false) @map("is_published")
  line        Line?   @relation(fields: [lineId], references: [id])

  @@map("content_blocks")
}

model MediaAsset {
  id               String         @id @default(uuid()) @db.Uuid
  provider         MediaProvider
  bucket           String?        @db.VarChar(60)
  path             String         @db.VarChar(500)  // "/images/products/..." ou "products/<uuid>.webp"
  alt              String         @db.VarChar(300)
  width            Int
  height           Int
  mimeType         String         @map("mime_type") @db.VarChar(40)
  sizeBytes        Int            @map("size_bytes")
  hasAlpha         Boolean        @default(false) @map("has_alpha")
  createdById      String?        @map("created_by_id") @db.Uuid
  createdAt        DateTime       @default(now()) @map("created_at") @db.Timestamptz
  lineMedia        LineMedia[]
  productImages    ProductImage[]
  skus             Sku[]
  protocolCovers   Protocol[]     @relation("ProtocolCover")
  protocolMappings Protocol[]     @relation("ProtocolMapping")
  casesBefore      ClinicalCase[] @relation("CaseBefore")
  casesAfter       ClinicalCase[] @relation("CaseAfter")

  @@map("media_assets")
}

model SlugRedirect {
  fromPath  String   @id @map("from_path") @db.VarChar(300)   // "/produtos/nome-antigo"
  toPath    String   @map("to_path") @db.VarChar(300)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@map("slug_redirects")
}

model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  actorId   String   @map("actor_id") @db.Uuid              // sem FK: o log sobrevive à exclusão do usuário
  entity    String   @db.VarChar(40)                        // "Sku", "Product"
  entityId  String   @map("entity_id") @db.VarChar(100)
  action    String   @db.VarChar(20)                        // create, update, publish, archive
  diff      Json
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([entity, entityId])
  @@map("audit_logs")
}
```

### 2.3 Mapa do seed

| Origem estática | Destino no banco |
|---|---|
| `LINES` (`lines.ts`) | 2 `Line`; `links` da PBSerum viram `ContentBlock` `line.pbserum.science-links`; `highlights` passam a ser contagens calculadas |
| `enzymesData` + `PRICE_PER_VIAL` | 3 `Product` PBSerum com `specs` (ativo, origem, substrato) e registro ANVISA · 3 `Sku` (`enz-slim-plus`, `enz-smooth-plus`, `enz-drain-plus`) a R$ 390,00 |
| `PROTOCOLS` + `protocolsData` | 8 `Protocol` (6 PUBLIC, `teste-pix` e `teste-cartao` INTERNAL) · `ProtocolComponent` com quantidade e função · 8 `Sku` com `code` = slug |
| `LA_CUTANEE_CATALOG` | 7 `Product` · 8 `Sku` (Solary com 2) · `ProductSection` · `PendingField` |
| `clinicalCasesData` | 9 `ClinicalCase` na PBSerum, vinculados ao protocolo por `categoryId`; `imageRightsNote` = "Material do fabricante" (confirmar antes da troca) |
| `SAFETY_NOTES` | 3 `SafetyNote` com `lineId` = PBSerum |
| `FAQ_ITEMS` | 3 `FaqItem` GLOBAL (compra, pedido mínimo, prazos) · 2 reescritos como LINE (registro, uso) |
| Imagens em `/public` | `MediaAsset` com `provider = LOCAL`, sem re-upload |
| `LEGACY_ALIASES` | 3 `SkuAlias`: `enz-slim`, `enz-smooth`, `enz-drain` |

Totais esperados após o seed: 2 linhas · 10 produtos · 8 protocolos · 19 SKUs · 3 aliases · 9 casos.

---

## 3. Roteiro

A ordem segue as prioridades pedidas, com duas exceções justificadas:

- **Fase 0 (nova, bloqueante):** o painel passará a alterar preços, e hoje as rotas de admin estão abertas.
- **Tokens de cor (5.1) sobem para o início da Fase 3:** a nova hero, os cards e as tags dependem deles; fazer depois causaria retrabalho.
- **Correção do subtotal (4.3) pode sair como hotfix imediato:** é independente de banco.

Cada fase termina em um estado implantável.

### Progresso de implementação

- [x] Fase 0 — proteção das rotas administrativas, remoção de segredos do código, RLS, baseline de migrações e testes automatizados.
- [x] Fase 1A — schema, seed idempotente e verificação de paridade.
- [x] Fase 1B — repositório de catálogo exclusivo do servidor e mapeadores.
- [x] Fase 1C — preços, disponibilidade, aliases, limites e totais do checkout validados pelo banco.
- [x] Fase 1D — vitrine pública alimentada pelo banco.
- [ ] Fase 1E — APIs e estrutura funcional do painel entregues; ainda faltam o refinamento dos formulários, reordenação visual e confirmação explícita de alteração de preço.
- [ ] Fase 1F — conteúdo institucional básico migrado; blocos científicos completos ainda dependem da revisão editorial/regulatória.
- [x] Fase 2 — catálogo, filtros por URL, navegação, breadcrumbs, retorno e casos clínicos por linha.
- [x] Fase 3 — linguagem editorial, tags reduzidas, header e hero das linhas.
- [x] Fase 4 — cards, imagem de produto e subtotal/limites de quantidade.
- [ ] Fase 5 — tokens e verificador de cores entregues; matriz visual, axe/Lighthouse e validação de contraste no formulário permanecem abertas.
- [x] Migração de imagens — 41 ativos no bucket `Catalogo`, com conversão WebP da La Cutanée e remigração isolada do Revytra validada.

### Fase 0 — Fundação segura

**Objetivo:** fechar rotas abertas, retirar credenciais do código e criar a infraestrutura de migração e testes que as fases seguintes usam.

Passos:

- [ ] **0.1** Commitar o trabalho atual (33 arquivos) em branch própria; o plano parte desse estado.
- [ ] **0.2** Rotacionar a senha do Postgres no Supabase. Remover os fallbacks de `prisma.ts`, `db.ts` e `run_migration.js`; lançar erro explícito se `DATABASE_URL` faltar. *(Código concluído; rotação externa pendente.)*
- [ ] **0.3** Criar `AUTH_JWT_SECRET` (≥ 32 bytes) separado da service role key; `auth.ts` falha se ausente. Rotacionar desconecta todos os usuários: combinar janela. *(Validação no código concluída; provisionamento/rotação externa pendente.)*
- [x] **0.4** Criar `requireAdmin(req)`: verifica o JWT, relê `role` em `user_profiles` pelo `userId` e responde 401 (sem token) ou 403 (sem papel). Aplicar em todas as rotas `/api/admin/**`.
- [x] **0.5** No painel, enviar `Authorization` também para stats e pedidos; remover a regra por e-mail; tratar 401/403 redirecionando para `/entrar`.
- [x] **0.6** Habilitar RLS em todas as tabelas do schema `public` (sem policies, a chave anon não acessa; o Prisma conecta como `postgres` e não é afetado). Atenção a `user_profiles`, que contém `password_hash`.
- [x] **0.7** Baseline de migrações:
  ```bash
  npx prisma db pull --print          # confirmar que o schema reflete o banco
  mkdir -p prisma/migrations/0_init
  npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
  npx prisma migrate resolve --applied 0_init   # em staging e em produção
  ```
- [ ] **0.8** `directUrl` no datasource; banco de staging (branch do Supabase) para desenvolvimento e previews. *(`directUrl` concluída; ambiente de staging não foi fornecido.)*
- [x] **0.9** Vitest configurado; primeiro teste cobre o `checkoutPricing` atual, como rede de segurança antes da refatoração.
- [x] **0.10** Zerar os 15 erros de lint. A maioria é `react-hooks/set-state-in-effect` na hidratação do `localStorage` (`CartContext.tsx:61`, `AuthContext.tsx:116`): trocar por `useSyncExternalStore`.
- [ ] **0.11** Recomendado: cookie httpOnly `aura_session` (`SameSite=Lax`, `Secure`) emitido no login, para o painel não depender de token no `localStorage`.

| Ação | Arquivo | Mudança |
|---|---|---|
| E | `src/lib/auth.ts` | Segredo obrigatório, sem fallback |
| C | `src/lib/adminGuard.ts` | `requireAdmin` com releitura do papel |
| E | `src/app/api/admin/orders/route.ts` | Guard em GET, PUT e DELETE |
| E | `src/app/api/admin/stats/route.ts` | Guard em GET |
| E | `src/app/api/admin/users/route.ts` | Troca `verifyAdminToken` por `requireAdmin` |
| E | `src/app/admin/page.tsx` | Header `Authorization` em todas as chamadas; sem regra por e-mail |
| E | `src/lib/prisma.ts` · `src/lib/db.ts` | Sem string de conexão no código |
| R | `scripts/run_migration.js` | Substituído por migrações Prisma |
| E | `prisma/schema.prisma` | `directUrl` |
| C | `prisma/migrations/0_init/migration.sql` | Baseline |
| C | `prisma/migrations/0_1_enable_rls/migration.sql` | `ALTER TABLE … ENABLE ROW LEVEL SECURITY` |
| C | `vitest.config.ts` · `src/lib/checkoutPricing.test.ts` | Testes |
| E | `src/context/CartContext.tsx` · `src/context/AuthContext.tsx` | Erros de lint |
| E | `package.json` | Scripts `test`, `db:migrate`, `db:seed`; dependências |
| C | `.env.example` | Variáveis sem valores reais |

**Aceite:**

- `curl -i /api/admin/orders` sem header → 401; token de USER → 403; token de admin rebaixado no banco → 403. Mesmo resultado em stats e users.
- `git grep -n "Auraregenera"` sem resultados; a senha antiga é recusada pelo Supabase.
- A aplicação não inicia sem `DATABASE_URL` ou `AUTH_JWT_SECRET`, com mensagem clara.
- `npx prisma migrate status` → "Database schema is up to date" em staging e produção.
- `npx tsc --noEmit` 0 · `npm run lint` 0 erros · `npm test` verde · `npm run build` ok.

### Fase 1 — Catálogo no banco e painel /admin (Prioridade 1)

Entregue em seis etapas, cada uma implantável.

#### 1A · Schema, seed e paridade (o site não muda)

- Migração `1_catalog_cms` com `prisma migrate dev --create-only` contra staging; acrescentar à mão os `CHECK` indicados no schema e o `ENABLE ROW LEVEL SECURITY` das novas tabelas.
- `prisma/seed.ts` idempotente: `upsert` por `slug` e por `code`.
- `scripts/verify-catalog-parity.ts`: para cada oferta do `CATALOG` estático, cada protocolo oculto e cada alias, compara `code → preço, nome composto, imagem` com o banco. Exige 0 divergências; inclui a asserção Revytra C20+ Nano = R$ 314,85.

| Ação | Arquivo |
|---|---|
| E | `prisma/schema.prisma` |
| C | `prisma/migrations/1_catalog_cms/migration.sql` |
| C | `prisma/seed.ts` |
| C | `scripts/verify-catalog-parity.ts` |

#### 1B · Camada de leitura no servidor

- `src/server/catalog/repository.ts` (`import "server-only"`): `getPublishedLines`, `getLineBySlug`, `getPublishedProducts({ lineSlug, categorySlug })`, `getFeaturedProducts(limit)`, `getProductBySlug`, `getProtocolsByLine`, `getProtocolBySlug`, `getCasesByLine`, `getFaq(scope, lineId)`, `getSafetyNotes(lineId)`, `resolveSkus(codes)`.
- `src/server/catalog/mappers.ts`: Prisma → view models com a forma atual de `CatalogItem`, convertendo `Decimal` em `number` uma única vez. Os componentes mudam pouco.
- `src/server/catalog/cache.ts`: constantes de tag e wrappers com cache (somente vitrine; checkout nunca usa).
- `LineId` deixa de ser a união `"pbserum" | "la-cutanee"` e passa a `string` (slug).

#### 1C · Checkout ligado ao banco

- `verifyCheckoutItems(rawItems, { allowInternal, resolver })` vira assíncrona; `resolver` padrão é `resolveSkus`, injetável nos testes.
- Regras: SKU ativo; produto ou protocolo `PUBLISHED`; linha `PUBLISHED`; `INTERNAL` só com `allowInternal`; se `trackStock`, quantidade ≤ estoque. O `id` devolvido continua sendo o código recebido (sem mudança de comportamento); acrescenta-se `skuCode` canônico.
- **Modo sombra:** variável `CHECKOUT_CATALOG_SOURCE=shadow|db`. Em `shadow`, calcula pelas duas fontes, usa a estática e registra divergências (só códigos, sem dados pessoais). Após 48 h sem divergência, muda para `db`.
- `POST /api/cart/quote`: recebe `[{ id, quantity }]` e devolve nome, preço, imagem e disponibilidade do servidor. Carrinho e checkout reconciliam ao carregar e avisam "O preço de GHK-Cu Sérum Booster Peptide foi atualizado". Evita o 409 tardio de `payment/process/route.ts:283-290`.
- Baixa de estoque, só com `trackStock`: `UPDATE catalog_skus SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND stock_quantity >= $1`, na mesma transação em que o pedido passa a `pago`; estorno no cancelamento.

| Ação | Arquivo | Mudança |
|---|---|---|
| E | `src/lib/checkoutPricing.ts` | Assíncrona, resolver injetável, regras de publicação e estoque |
| C | `src/lib/checkoutLimits.ts` | `MAX_QUANTITY_PER_ITEM = 20`, `MAX_DISTINCT_ITEMS = 25` (cliente e servidor) |
| C | `src/lib/money.ts` | `roundMoney` compartilhado |
| E | `src/app/api/payment/process/route.ts` | `await` na linha 245; `findItemDescription` (66-78) usa o SKU resolvido em vez de `enzymesData`/`protocolsData`; URLs absolutas do Storage passam sem prefixo |
| E | `src/app/api/orders/route.ts` | `await` na linha 71 |
| C | `src/app/api/cart/quote/route.ts` | Cotação do carrinho |
| E | `src/context/CartContext.tsx` | Teto de 20; remove `PROTOCOL_IMAGE_MAP` e import de `Protocol`; `reconcile(quotes)` |
| E | `src/app/carrinho/page.tsx` · `src/app/checkout/page.tsx` | Chamam a cotação e exibem aviso de preço |

#### 1D · Site público lendo do banco

- Páginas `page.tsx` (Home), `linhas/[slug]`, `produtos/[slug]` e `protocolos/[slug]` usam o repositório. `generateStaticParams` consulta slugs publicados; `dynamicParams = true` para produtos novos; consulta `SlugRedirect` antes de `notFound()`.
- `SiteHeader` é client component renderizado em cada página: criar `SiteHeaderServer` que busca as linhas e as passa como prop.
- `CatalogDetail` recebe dados de protocolo pelo view model (sem `getProtocolBySlug`); `CatalogCard` recebe cores da linha pelo view model (sem `LINES`); `CatalogBrowser` perde os nomes fixos da linha 25.
- Kits de teste do painel (`BuyNowButton`) leem SKUs `INTERNAL` pela API.
- `next.config.ts`: `images.remotePatterns` para `https://<projeto>.supabase.co/storage/v1/object/public/**`.
- Os módulos `la-cutanee.ts`, `pbserum.ts`, `catalog.ts` (dados), `lines.ts`, `cases.ts` e `safety.ts` vão para `prisma/seed-data/`. `enzymes.ts`, `products.ts` e `articles.ts` continuam atendendo o conteúdo científico de `/enzimas` até a etapa 1F, mas nada de preço sai deles.

#### 1E · Painel administrativo

O `admin/page.tsx` (1470 linhas) é dividido em rotas com um layout protegido.

| Rota | Função |
|---|---|
| `/admin` | Visão geral atual + pendências: fichas em confirmação, SKUs sem estoque, casos sem direito de imagem confirmado, os 6 destaques da Home |
| `/admin/pedidos` · `/admin/clientes` · `/admin/perfil` · `/admin/testes` | Abas atuais extraídas |
| `/admin/linhas` · `/admin/linhas/[id]` | Lista ordenável; identidade (cores claro/escuro com contraste calculado), textos institucionais, logo, hero, banners |
| `/admin/categorias` | CRUD e ordenação |
| `/admin/produtos` · `/novo` · `/[id]` | Tabela filtrável; editor em abas: Básico · Conteúdo · Preço e variações · Mídia · Ficha técnica · Logística · Publicação |
| `/admin/protocolos` · `/[id]` | Componentes (produto + quantidade de ampolas + função), campos clínicos, preço do kit |
| `/admin/casos` · `/[id]` | Upload antes/depois com prévia do comparador, vínculo linha/protocolo, parâmetros, confirmação de direito de imagem |
| `/admin/conteudo` | FAQ geral e por linha, avisos de segurança, blocos institucionais |
| `/admin/midia` | Biblioteca; `alt` obrigatório; mostra onde a mídia é usada; bloqueia exclusão em uso |
| `/admin/auditoria` | Histórico de alterações com diff |

Endpoints (todos com `requireAdmin`, validação Zod, `AuditLog` e revalidação por tag):

| Método | Rota | Regra |
|---|---|---|
| GET · POST | `/api/admin/catalog/lines` | — |
| GET · PATCH · DELETE | `/api/admin/catalog/lines/[id]` | DELETE arquiva se houver produtos |
| POST | `/api/admin/catalog/lines/reorder` | `{ ids }` em transação |
| GET · POST | `/api/admin/catalog/categories` (+ `/[id]`) | — |
| GET · POST | `/api/admin/catalog/products` | Filtros `line`, `status`, `category`, `q` |
| GET · PATCH | `/api/admin/catalog/products/[id]` | `If-Match: <updatedAt>`; 409 em edição concorrente |
| POST | `/api/admin/catalog/products/[id]/publish` · `/archive` | Publicar valida campos obrigatórios e ao menos 1 SKU ativo |
| POST · PATCH · DELETE | `/api/admin/catalog/products/[id]/skus` (+ `/[skuId]`) | `code` imutável depois de aparecer em `order_items`; DELETE vira `isActive = false` se já vendido |
| GET · POST · PATCH | `/api/admin/catalog/protocols` (+ `/[id]`) | Componentes gravados em transação |
| GET · POST · PATCH | `/api/admin/catalog/cases` (+ `/[id]`) | Publicar exige `imageRightsConfirmed` |
| GET · POST · PATCH · DELETE | `/api/admin/content/faq` · `/safety-notes` · `/blocks` | — |
| POST | `/api/admin/media/upload-url` | PNG, JPEG ou WebP; ≤ 8 MB; devolve URL assinada |
| POST | `/api/admin/media` | Confirma upload; `sharp` lê dimensões e transparência; `purpose=clinical` remove EXIF e converte em WebP |
| POST | `/api/admin/preview` | Token de prévia de 5 min; `/api/preview?token=` ativa `draftMode()` e redireciona |
| GET | `/api/admin/catalog/skus?visibility=INTERNAL` | Kits de teste |
| GET | `/api/admin/audit` | Filtros por entidade |

Decisões de UX do painel:

- Tabelas para listas administrativas; estados vazios com a ação principal ("Cadastrar primeiro produto").
- Salvamento explícito ("Salvar rascunho", "Publicar") e aviso ao sair com alterações pendentes.
- Mudança de preço pede confirmação com a diferença: "R$ 404,85 → R$ 389,00 (−3,9%)".
- Slug gerado do nome e editável só em rascunho; depois de publicado, alterar cria `SlugRedirect`.
- Cores de linha com contraste calculado (texto sobre superfície ≥ 4,5:1 nos dois temas); salvar é bloqueado se falhar.
- Imagem de produto sem transparência gera aviso; o botão "Recortar margens" aplica `sharp().trim()` (achado A9).
- Reordenação por arrastar e por botões ↑ ↓ acessíveis por teclado.
- Componentes: `AdminShell`, `AdminGuard`, `DataTable`, `FormField`, `MediaPicker`, `SkuEditor`, `ListEditor` (listas de texto), `KeyValueEditor` (specs e parâmetros), `SectionsEditor`, `ContrastField`, `PublishBar`.

Ordem de entrega do painel: produtos e SKUs → protocolos → casos → linhas → conteúdo.

#### 1F · Conteúdo institucional

- `FaqAccordion` e a seção de FAQ recebem `items` por prop.
- Textos científicos de `/enzimas` migram para `ContentBlock` (baixa prioridade).
- Atualizar o CLAUDE.md: banco como fonte, `prisma/seed-data`, painel, nova regra de tags.

**Aceite da Fase 1:**

- Paridade: 0 divergências em 19 SKUs e 3 aliases.
- `rg "@/data/(protocols|enzymes|la-cutanee|pbserum|catalog)" src/lib src/app/api src/context` sem resultados.
- Carrinho salvo antes da troca, com `enz-slim` e `queixo-duplo`, conclui o pedido; `OrderItem` grava nome e preço do servidor.
- Preço do GHK-Cu alterado no painel: página atualizada após salvar; carrinho antigo mostra aviso; cobrança usa o preço novo.
- Produto em DRAFT: 404 no site, 400 no checkout, visível na prévia.
- `teste-pix`: 400 para USER, aceito para ADMIN.
- Upload de SVG ou GIF recusado; arquivo de 9 MB recusado; foto clínica processada sem EXIF nem GPS.
- Segundo salvamento com `updatedAt` antigo → 409.
- Toda mutação gera `AuditLog` com diff.

### Fase 2 — Rotas e navegação (Prioridade 2)

#### 2.1 Página `/catalogo`

- Server component com produtos `PUBLIC` e `PUBLISHED` (sem protocolos).
- `CatalogFilters` (client): Linha e Categoria com contagem, "Limpar filtros" e contador `aria-live` ("7 produtos"). Estado na URL (`?linha=la-cutanee&categoria=serum-facial`) via `router.replace(…, { scroll: false })`, dentro de `<Suspense>` por causa de `useSearchParams`. Com cerca de 10 produtos, o filtro roda no cliente sobre a lista completa.
- Grade `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`; estado vazio com ação de limpar.

#### 2.2 Vitrine da Home

- `getFeaturedProducts(6)`: primeiro os marcados como destaque, por `featuredOrder`. Se houver menos de 6, completa com produtos publicados em rotação diária determinística (semente = data `AAAA-MM-DD`). Sorteio por requisição foi descartado: quebra o cache e muda a vitrine a cada recarga.
- Grade `grid-cols-2 lg:grid-cols-3`, no máximo 2 fileiras no desktop.
- Link ao final: **"Ver mais produtos no catálogo →"** para `/catalogo`, com a seta deslocando 4 px no hover.
- Nenhum protocolo na Home. As contagens fixas "3 produtos · 6 protocolos" (`HeroSection.tsx:37-38`) passam a vir do banco.

#### 2.3 Protocolos apenas na página da linha

- Seção `#protocolos` em `/linhas/[slug]`, exibida só se a linha tiver protocolos publicados, em formato de lista editorial (não usa o card de produto).
- `/protocolos/[slug]` continua como página de detalhe, com retorno à linha.

#### 2.4 Breadcrumbs e retorno

- `Breadcrumbs` (server) monta a hierarquia a partir dos dados e emite JSON-LD `BreadcrumbList`.
- `NavigationTracker` no layout grava o caminho interno anterior em `sessionStorage`.
- `BackLink` (client): se houver caminho interno anterior, `router.back()` (preserva filtros e rolagem); se o acesso foi direto, `router.push(fallbackHref)`.

| Página | Breadcrumb | Fallback do "Voltar" |
|---|---|---|
| `/catalogo` | Início / Catálogo | `/` |
| `/linhas/[slug]` | Início / {Linha} | `/catalogo?linha={slug}` |
| `/produtos/[slug]` | Início / {Linha} / {Produto} | `/linhas/{linha}` |
| `/protocolos/[slug]` | Início / {Linha} / Protocolos / {Protocolo} | `/linhas/{linha}#protocolos` |
| `/linhas/[slug]/casos-clinicos` | Início / {Linha} / Casos clínicos | `/linhas/{linha}` |
| `/enzimas` | Início / PBSerum / Ciência | `/linhas/pbserum` |
| `/carrinho` | Início / Carrinho | `/catalogo` |

Casos clínicos passam a pertencer à linha, pois podem existir para La Cutanée: nova rota `/linhas/[slug]/casos-clinicos`; `/casos-clinicos` responde `permanentRedirect` para `/linhas/pbserum/casos-clinicos`.

| Ação | Arquivo | Mudança |
|---|---|---|
| C | `src/app/catalogo/page.tsx` | Nova rota |
| C | `src/components/catalog/CatalogFilters.tsx` · `CatalogGrid.tsx` | Filtros e grade |
| R | `src/components/catalog/CatalogBrowser.tsx` | Substituído (filtro por tipo deixa de existir) |
| C | `src/components/catalog/FeaturedProducts.tsx` | Vitrine curta com link ao catálogo |
| E | `src/app/page.tsx` | Usa `FeaturedProducts` |
| E | `src/data/site.ts` | `NAV_LINKS`: `/#catalogo` → `/catalogo` |
| E | `src/components/layout/SiteHeader.tsx` | Linhas 31, 36 e 55 |
| E | `src/app/carrinho/page.tsx` (47, 71) · `src/app/minha-conta/page.tsx` (455) | Links para `/catalogo` |
| E | `src/components/catalog/CatalogDetail.tsx` | Linha 21: breadcrumb e `BackLink` |
| E | `src/app/linhas/[slug]/page.tsx` | Seção `#protocolos`; link para casos quando existirem |
| C | `src/components/navigation/Breadcrumbs.tsx` · `BackLink.tsx` · `NavigationTracker.tsx` | Navegação |
| E | `src/app/layout.tsx` | Monta o `NavigationTracker` |
| C | `src/app/linhas/[slug]/casos-clinicos/page.tsx` | Casos por linha |
| E | `src/app/casos-clinicos/page.tsx` | Redirect permanente |
| E | `src/components/sections/CasosClinicosGallery.tsx` | Casos e categorias por prop |
| E | `src/app/enzimas/page.tsx` | Breadcrumb e retorno |
| R | `ClinicalCasesSection.tsx` · `ClinicalCaseCard.tsx` · `IndicationsSection.tsx` · `EnzymeTriadSection.tsx` · `ui/ScrollHint.tsx` · `ui/PhotoSlot.tsx` · `data/indications.ts` | Sem uso (confirmado por busca); verificar `hooks/useScrollHint.ts` antes de remover |

**Aceite da Fase 2:**

- `rg "/#catalogo" src` sem resultados; "Catálogo" leva a `/catalogo` no desktop e no mobile.
- Recarregar `/catalogo?linha=la-cutanee` mantém o filtro; voltar de um produto restaura filtro e rolagem.
- Home com no máximo 6 produtos, nenhum protocolo e o link ao catálogo; mesmo conjunto em recargas no mesmo dia.
- Em nova aba, `/linhas/pbserum/casos-clinicos` → "Voltar" leva a `/linhas/pbserum`. `/casos-clinicos` responde 308.
- `BreadcrumbList` válido no Rich Results Test.

### Fase 3 — UI editorial (Prioridade 3)

Começa pelos tokens de cor da etapa 5.1.

#### 3.1 Tags

| Local | Hoje | Depois |
|---|---|---|
| `HeroSection.tsx:14, 28-30` | 4 tags (selo com emoji e 3 flutuantes) | Nenhuma; eyebrow em texto mono |
| `CatalogCard.tsx:16-19, 32-34` | 2 sobre a foto e até 3 abaixo | Nenhuma; linha como eyebrow na cor da marca |
| `CatalogDetail.tsx:27, 33` | Até 3 sobre a foto e 3 no painel | No máximo 2 (`highlights`), só no painel |
| `PurchasePanel.tsx:59` | 2 tags de pagamento | Texto: "Até 10x no cartão · 5% de desconto no PIX" |
| `linhas/[slug]/page.tsx:36, 39, 51` | Descritor, destaques e selos | Nenhuma; destaques viram fileira numérica, compromissos viram lista corrida |
| `SafetyFaqSection.tsx:35` | Pílula da linha | Removida (a seção passa a ser por linha) |
| `SiteHeader.tsx:35, 56` | Emoji da linha | Removido |

- `Tag.tsx`: tons via variáveis CSS da linha, sem hex fixo.
- Zod: `highlights.max(2)` e bloqueio de emoji (`\p{Extended_Pictographic}`).
- CLAUDE.md: "Emoji somente em tags, no máximo três tags por card" → "Cards sem tags; até 2 tags informativas no detalhe; sem emoji."

#### 3.2 Layout editorial nas páginas de detalhe

- `EditorialSections`: cada seção é um `<section>` com `border-t border-content/10` e `py-10 md:py-14`; no desktop, grade `lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]` com título Sora 600 fixo em `top-32` à esquerda e texto à direita. Corpo Manrope 17px/1,7, largura máxima de 62ch.
- Listas com divisores finos (`divide-y divide-content/8`, `py-3`) no lugar dos ícones de check. Listas curtas, como Ativos, correm em linha separadas por "·" ou em duas colunas.
- `SpecList`: `<dl>` com rótulos em JetBrains Mono (Apresentação, Conteúdo, Sessões, Frequência, Registro ANVISA 25351.022708/2021-03), substituindo as pílulas de `CatalogDetail.tsx:37-38`.
- Protocolo: Composição como tabela (Ampolas · Produto · Função, por exemplo "2 · Slim+ (Lipase) · Redução da gordura localizada"); Reconstituição como lista numerada, pois é uma sequência real; Marcação como texto seguido da imagem de mapeamento em largura total; Resultados esperados em duas colunas.
- "Ficha técnica em confirmação" vira seção discreta com fio tracejado, sem caixa tingida.
- La Cutanée: Missão, Visão e Valores em três colunas de texto (hoje cards, linha 47); Diferenciais em duas colunas com divisores (hoje card navy, linha 50).
- PBSerum: links "Ciência" e "Casos clínicos" viram linhas editoriais com seta (hoje cards, linha 56).

#### 3.3 Hero das páginas de linha

`LineHero` com as cores da linha vindas do banco:

- **Texto (esquerda):** eyebrow mono com o descritor; nome em Sora 600, `clamp(3.25rem, 8vw, 6.5rem)`, tracking −0,045em; tagline em 20px e até 34ch; fileira numérica calculada ("3 produtos | 6 protocolos | 9 casos") com números em Sora e rótulos em mono, separados por fios verticais; ações "Ver produtos" e "Protocolos clínicos" (a segunda só se existirem).
- **Imagem (direita):** `heroImage` cadastrada no painel. Na falta dela, compõe até 4 fotos de produtos da linha.
  - **PBSerum:** as três ampolas (Slim+, Smooth+, Drain+) em alturas escalonadas sobre um fio dourado; sob o fio, os números de processo ANVISA em mono. É informação real, não ornamento.
  - **La Cutanée:** frascos alinhados sobre uma única "prateleira" com sombra de contato e o conteúdo líquido (15 ml, 30 ml, 40 g) em mono sob cada um.
- **Sem:** bolhas de brilho, texto em gradiente ou tags flutuantes (padrões atuais de `casos-clinicos/page.tsx` que serão retirados).
- **Tema escuro:** PBSerum `#1F1A12` com acento `#D8B657`; La Cutanée `#0F1D30` com acento `#8FB3E0` (valores iniciais, editáveis no painel).
- **Movimento:** uma única entrada (frascos sobem 12 px com fade de 500 ms e intervalo de 60 ms), anulada por `prefers-reduced-motion` pela regra global existente.

#### 3.4 Header

`SiteHeader.tsx:26` e adjacentes:

| Propriedade | Hoje | Depois |
|---|---|---|
| Padding vertical | `py-3` (~72 px) | `py-4` (~80 px) |
| Distância do topo | `pt-3` | `pt-4` |
| Logo | `h-11 sm:h-12` | `h-12 sm:h-14` |
| Navegação | `gap-6 text-sm`, inativo `text-white/82` | `gap-8 text-[15px]`, inativo `text-white/90` |
| Botões de ícone | `h-10 w-10` | `h-11 w-11` (alvo de 44 px) |
| Âncoras | `scroll-mt-32` | `scroll-mt-36` |
| Cor | `bg-[#0D1B2A]/96` | `--surface-chrome` |

#### 3.5 FAQ da Home

- A Home exibe apenas `FaqItem` com `scope = GLOBAL`. Temas: quem pode comprar (cadastro profissional com CPF/CNPJ); como criar a conta; formas de pagamento (até 10x no cartão, 5% de desconto no PIX); pedido mínimo (não há); frete e prazo (calculado pelo CEP no checkout, com rastreamento); contato com a equipe. As respostas nascem em rascunho e são publicadas após revisão do negócio.
- Vão para a página da PBSerum: os 3 avisos de segurança, a pergunta sobre registro ANVISA e a de reconstituição e marcação.
- `SafetyFaqSection` perde o bloco de avisos e vira `FaqSection` (recebe `items`); nasce `LineSafetySection` na página da linha.

**Aceite da Fase 3:**

- No máximo 2 tags por página de produto e nenhuma nos cards.
- Nenhum card aninhado exibindo texto corrido nas páginas de produto, protocolo e linha.
- A FAQ da Home não menciona PBSerum, ampola, reconstituição nem ANVISA.
- Header até 88 px no desktop e até 72 px em 390 px, sem deslocamento de layout.

### Fase 4 — Cards e página de produto (Prioridade 4)

#### 4.1 Card de produto

- **Alinhamento:** o link usa `mt-6` (`CatalogCard.tsx:35`), e essa é a causa do desalinhamento. Trocar por `mt-auto` com `pt-5` no bloco de conteúdo. Título com `line-clamp-2`; resumo de `line-clamp-3` para `line-clamp-2`. Refinamento opcional: `grid-rows-subgrid` para alinhar eyebrow, título, resumo e botão entre cards da mesma fileira.
- **Escala:** `p-3` → `p-2.5`; título `text-xl` → `text-lg`; `gap-5` → `gap-4`; imagem `p-8` → `p-5` (depois do recorte dos arquivos).
- **Fundo:** remover o `backgroundColor` inline (linha 15). A mídia fica transparente, com halo suave `radial-gradient(closest-side, color-mix(in oklab, var(--line-surface) 70%, transparent), transparent)` e `drop-shadow` discreto na foto. Fotos de protocolo mantêm `object-cover` e raio de 18 px.
- **Botão:** `bg-[#12283C] text-white` → `bg-action text-action-fg` (hoje quase some sobre o card escuro `#16293B`).
- **Arquivos (achado A9):** `scripts/trim-product-images.ts` com `sharp().trim()`, altura máxima de 1600 px e saída WebP com alfa para os 8 PNGs La Cutanée (≈ 9 MB hoje). O upload do painel aplica o mesmo processo.

#### 4.2 Imagem na página de produto

- `CatalogDetail.tsx:26-28`: remover `p-10 md:p-16`; a imagem fica em um wrapper `absolute inset-[12%]` com `object-contain`, ocupando cerca de 76% de cada dimensão. Com o arquivo recortado, o frasco usa ~72–76% da altura. Protocolos seguem com foto em `object-cover`.
- Manter `priority` (LCP) e `sizes`.

#### 4.3 Quantidade × preço

```tsx
const max = offer.trackStock ? Math.min(MAX_QUANTITY_PER_ITEM, offer.stock ?? 0) : MAX_QUANTITY_PER_ITEM;
const subtotal = roundMoney(offer.price * quantity);

<p aria-live="polite" className="font-display text-3xl font-semibold tabular-nums">{formatBRL(subtotal)}</p>
<p className="text-xs text-content/55">
  {quantity > 1 ? `${quantity} × ${formatBRL(offer.price)}` : `por ${item.presentation.toLowerCase()}`}
</p>
```

- `−` desativado em 1 e `+` desativado no máximo, ambos com `disabled` e `aria-label`.
- Trocar a variação mantém a quantidade e recalcula.

| Ação | Arquivo | Mudança |
|---|---|---|
| E | `src/components/catalog/CatalogCard.tsx` | Alinhamento, escala, fundo, botão |
| E | `src/components/catalog/CatalogDetail.tsx` | Escala da imagem |
| E | `src/components/catalog/PurchasePanel.tsx` | Subtotal dinâmico, limites |
| C | `scripts/trim-product-images.ts` | Recorte e WebP |
| C | `src/components/catalog/PurchasePanel.test.tsx` | Testes de interface |

**Aceite da Fase 4:**

- Em 1280 px, com "Hyalu B3 Preenchedor Biomimético Full Face" (maior nome) e "Revytra C20+ Nano" na mesma fileira, a base dos botões coincide (±1 px em `getBoundingClientRect().bottom`).
- Nenhuma caixa visível atrás dos frascos, nos dois temas.
- Frasco com pelo menos 70% da altura do container em 390, 768 e 1280 px.
- Teste: GHK-Cu (R$ 404,85) com `+` duas vezes → "R$ 1.214,55"; Solary com cor (R$ 224,85) × 2 → "R$ 449,70"; `+` desativado em 20.

### Fase 5 — Cores, seções e temas (Prioridade 5)

#### 5.1 Tokens (executar no início da Fase 3)

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--surface-canvas` | `#EEF1F5` | `#0A1622` | Fundo da página (existe) |
| `--surface-card` | `#FFFFFF` | `#16293B` | Cartões (existe) |
| `--surface-raised` | `#F7F8FA` | `#112233` | Seção alternada (novo) |
| `--surface-chrome` | `#0D1B2A` | `#0F2131` | Header e footer; escuro nos dois temas por decisão de marca (novo) |
| `--line-surface` · `--line-accent` · `--line-ink` | Por linha | Por linha | Definidos por `LineScope` a partir do banco |

- `LineScope` escreve `--line-surface-light` e `--line-surface-dark` inline; o CSS resolve `.line-scope { --line-surface: var(--line-surface-light) }` e `.dark .line-scope { --line-surface: var(--line-surface-dark) }`. Uso com `bg-(--line-surface)` do Tailwind v4.
- `--surface-panel` (navy nos dois temas) deixa de pintar seções de conteúdo.

#### 5.2 Cores fixas encontradas

| Arquivo | Problema | Correção |
|---|---|---|
| `src/app/casos-clinicos/page.tsx:20` (conteúdo migra para a rota da linha) | `bg-[#0D1B2A]` fixo e texto branco | Tokens de superfície e conteúdo |
| `CasosClinicosGallery.tsx:39-41, 126, 137, 143, 164, 184, 197-201` | Paleta escura fixa | Tokens; figuras em `bg-card` |
| `EnzymesBiotechIntroSection.tsx:142` | `bg-[#0A1622]` fixo em `/enzimas` | `bg-raised` e tokens |
| `ClinicalMappingSection.tsx:8, 24, 28, 48, 68` | Claro fixo (`#F7F5F0`, `#0A1622`): continua claro no tema escuro | `bg-raised text-content`; legendas em `bg-card` |
| `SafetyFaqSection.tsx:18, 32-38` | `bg-panel` escuro nos dois temas e `#162A3D` | Seção clara no tema claro |
| `FaqAccordion.tsx:42-46, 51, 63, 73` | Tom `dark` com hex | Tokens; remover a prop `tone` |
| `linhas/[slug]/page.tsx:34, 47, 50, 51` | Superfície inline; `#153459`, `#E7EEF8` | `LineScope` |
| `CatalogDetail.tsx:26, 56` | Superfície inline; pendências `#E7EEF8`/`#153459` | Tokens |
| `CatalogCard.tsx:15, 35` | Superfície inline; botão `#12283C` | Transparente; `bg-action` |
| `CatalogBrowser.tsx:24, 32` | Chips `#12283C` e `#C59D3F` | Removido na Fase 2 |
| `HeroSection.tsx:18, 37-38` | Botão e faixas de linha fixos | Tokens e `LineScope` |
| `Tag.tsx:10-13` | Tons fixos | Variáveis CSS |
| `PurchasePanel.tsx:47` | Variação `#2B5C9E` fixo | `--line-accent` |
| `carrinho/page.tsx:96` | Avatar `#0D1B2A` | `bg-card` |

Exceções permitidas: `CardBrandBadge.tsx` (cores das bandeiras de cartão) e `SiteHeader`/`SiteFooter` via `--surface-chrome`. O painel admin entra na lista de exceções até ser refeito na etapa 1E.

#### 5.3 Ritmo das seções

Regra: seções consecutivas alternam `canvas` e `raised`; apenas uma faixa com a cor da linha por página (a hero); o raio de 32 px fica para a hero e no máximo um painel de destaque.

| Página | Sequência |
|---|---|
| Home | Hero (card) → Destaques (canvas) → FAQ geral (raised) → Footer (chrome) |
| `/linhas/pbserum` | Hero (linha) → Produtos (canvas) → Protocolos (raised) → Indicações (canvas) → Mapeamento (raised) → Casos clínicos (canvas) → Segurança e FAQ (raised) → Footer |
| `/linhas/la-cutanee` | Hero (linha) → Produtos (canvas) → Institucional (raised) → FAQ da linha (canvas) → Footer |
| `/produtos/[slug]` | Detalhe (canvas) → Seções editoriais (canvas, com fios) → Relacionados (raised) |

#### 5.4 Proteção contra regressão

- `scripts/check-hardcoded-colors.mjs` e `npm run check:colors`: falha com `bg-[#`, `text-[#`, `border-[#`, `from-[#` ou `style={{ backgroundColor` em `src/app` e `src/components`, exceto a lista de exceções.

**Aceite da Fase 5:**

- `npm run check:colors` sem ocorrências.
- Alternar o tema muda todas as seções, exceto header e footer.
- axe/Lighthouse sem violações de contraste nas páginas da matriz.

---

## 4. Checklist de verificação

### Banco e migrações

- [ ] `npx prisma migrate status` limpo em staging e produção.
- [ ] `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url "$SHADOW_DATABASE_URL"` sem diferenças.
- [x] `npm run db:seed` executado duas vezes → mesmas contagens (2 linhas, 10 produtos, 8 protocolos, 19 SKUs, 3 aliases, 9 casos).
- [x] RLS: `select relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity;` → 0 linhas.
- [x] Constraints: SKU com produto e protocolo ao mesmo tempo → erro; caso publicado sem direito de imagem → erro.
- [x] Backup (`pg_dump`) realizado antes de `prisma migrate deploy` no banco conectado.
- [x] `prisma migrate deploy` roda como etapa separada antes do deploy, nunca dentro de `npm run build` (evita migração concorrente em previews).

### Imagens e Storage

- [x] Bucket solicitado localizado sem diferenciar maiúsculas/minúsculas; nome real no Supabase: `Catalogo`.
- [x] 41 imagens do catálogo enviadas ao Storage; imagens La Cutanée convertidas para WebP com até 1600 px de altura.
- [x] Nova imagem do Revytra migrada isoladamente para WebP e validada na URL pública (HTTP 200, 507 × 1489 px, 112.966 bytes).
- [x] Registros `MediaAsset` sincronizados com caminho, MIME type, dimensões e tamanho dos arquivos publicados.

### Integridade do checkout

- [x] Resolvem: `enz-slim`, `enz-smooth`, `enz-drain`, `enz-slim-plus`, `enz-smooth-plus`, `enz-drain-plus`, `queixo-duplo`, `perfilamento-facial`, `gordura-localizada`, `celulite`, `cicatrizes`, `fibrose-pos-cirurgica`, `solary-aox-fps-60-sem-cor`, `solary-aox-fps-60-com-cor`.
- [x] Preço enviado pelo cliente é ignorado; Revytra C20+ Nano = R$ 314,85.
- [x] Quantidades 0, 21 e 1,5 recusadas; 26 itens distintos recusados.
- [x] Produto DRAFT ou ARCHIVED, SKU inativo e linha arquivada recusados.
- [x] `teste-pix` e `teste-cartao`: USER recusado, ADMIN aceito.
- [x] PIX: total = arredondar((subtotal + frete) × 0,95); cartão sem desconto.
- [ ] Banco indisponível → 503 e nenhum pedido criado.
- [ ] Paridade estática × banco com 0 divergências; modo sombra por 48 h sem divergência.
- [ ] Carrinho antigo (`aura_cart_v1` com `enz-slim`) conclui pedido em staging no sandbox do Mercado Pago.
- [ ] Preço alterado no painel → aviso no carrinho → cobrança com o preço novo.
- [ ] Pedidos anteriores exibem nome e valores originais no painel e em Minha Conta.

### Painel e segurança

- [x] Todas as rotas `/api/admin/**`: proteção centralizada; 401 sem token, 403 com USER, 403 com admin rebaixado validados.
- [ ] Tipo e tamanho de upload validados no servidor; foto clínica sem EXIF/GPS.
- [ ] `AuditLog` registra criação, mudança de preço, publicação e arquivamento.
- [x] 409 em edição concorrente.
- [x] `git grep` sem segredos; `.env.example` sem valores reais.

### Navegação

- [x] `rg "/#catalogo" src` sem resultados.
- [x] "Voltar" de produto restaura os filtros de `/catalogo`; acesso direto usa o fallback hierárquico.
- [ ] `/casos-clinicos` → 308; `/enzimas/slim` → 308 para `/produtos/slim-plus` (já existe).
- [ ] Slug alterado → URL antiga responde 308.

### Responsividade (360, 390, 768, 1024, 1280 e 1536 px)

- [ ] Sem rolagem horizontal.
- [ ] Botões "Ver detalhes" alinhados por fileira.
- [ ] Frasco com ≥ 70% da altura do container na página de produto.
- [ ] Header com logo legível, alvos de toque ≥ 44 px e menu mobile sem cobrir o carrinho.
- [x] Home com 6 produtos, distribuídos em 3 destaques de cada linha (2 fileiras no desktop).

### Temas e acessibilidade

- [ ] Matriz claro/escuro × Home, `/catalogo`, as 2 linhas, 1 produto de cada linha, 1 protocolo, casos clínicos, `/enzimas`, carrinho, checkout e painel.
- [x] `npm run check:colors` sem ocorrências.
- [ ] axe/Lighthouse: 0 violações de contraste; Acessibilidade ≥ 95.
- [x] `prefers-reduced-motion`: entrada da hero e zoom dos cards desativados.
- [ ] Cores de linha com contraste validado no formulário.

### Build

- [x] `npx tsc --noEmit` sem erros.
- [x] `npm run lint` sem erros (0 erros; avisos legados permanecem).
- [x] `npm test` verde.
- [ ] `npm run build` ok, com `DATABASE_URL` no ambiente de build.

---

## 5. Riscos

| Risco | Mitigação |
|---|---|
| Rotação do segredo JWT desconecta todos | Janela combinada e aviso aos clientes |
| Build passa a depender do banco (`generateStaticParams`) | `DATABASE_URL` no build; se indisponível, retornar `[]` e contar com `dynamicParams` |
| Previews da Vercel apontando para produção | Banco de staging para previews |
| FAQ geral sem validação do negócio | Itens nascem em rascunho |
| Direito de imagem dos casos existentes | Confirmar a origem antes da troca |
| Estoque real ainda desconhecido | `trackStock = false` por padrão |
| Painel extenso | Entrega na ordem produtos → protocolos → casos → linhas → conteúdo |

## 6. Ordem de PRs

1. Hotfix do subtotal (4.3), independente de banco.
2. Fase 0: segurança, baseline de migrações, testes e lint.
3. 1A: schema, seed e paridade.
4. 1B + 1C: leitura no servidor e checkout em modo sombra.
5. 1D: site público no banco; checkout em modo `db`.
6. 1E: painel (produtos e SKUs → protocolos → casos → linhas → conteúdo) e 1F.
7. Fase 2: rotas e navegação.
8. 5.1 + Fase 3: tokens e UI editorial.
9. Fase 4 (restante) e Fase 5.
