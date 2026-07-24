# Landing Page B2B pbserum Plus (Aura Medical)

## O que é o projeto

Landing page B2B de alta conversão para clínicas, dermatologistas e cirurgiões
comprarem a linha **pbserum Plus** (enzimas recombinantes) através da
**Aura Medical**, distribuidora oficial no Brasil.

Originalmente construída como um Design Component de arquivo único
(`Landing Page pbserum Plus.dc.html`), foi refatorada para **Next.js 16 (App
Router) + TypeScript + Tailwind CSS v4**. O protótipo original está em
`_legacy/` (gitignored) apenas como referência — nada em `src/` depende dele.

## Stack e comandos

- Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind CSS v4, ESLint 9.
- `npm run dev` · `npm run build` · `npm start` · `npx eslint src`

## Estrutura

```
src/
  app/
    layout.tsx          fontes (next/font), metadata, <html lang="pt-BR">
    globals.css         @theme (tokens) + as poucas regras CSS não-utilitárias
    page.tsx            monta as seções na ordem final
  components/
    accreditation/      AccreditationProvider (context) · AccreditationModal · AccreditationButton
    layout/             SiteHeader · SiteFooter
    sections/           HeroSection · ScienceSection · ProductsSection (+ ProductCard)
                        ClinicalCasesSection (+ CaseCard) · IndicationsSection
                        ProtocolsSection (+ ProtocolPanel) · SafetyFaqSection (+ FaqAccordion)
    ui/                 SectionIntro · PhotoSlot
  data/                 enzymes · products · cases · indications · protocols · safety · site
  hooks/                useMediaQuery
  lib/                  format (formatBRL)
public/
  images/products/      renders reais das caixas (2000×1149)
  images/cases/         fotos antes/depois já enviadas
  docs/                 PDFs de referência (não linkados na página ainda)
```

## Convenções de código

- **Server Components por padrão.** `"use client"` só onde há estado ou
  listener: `SiteHeader`, `ClinicalCasesSection`, `ProtocolsSection`,
  `ProtocolPanel`, `FaqAccordion` e todo o `accreditation/`. Seções estáticas
  (Hero, Ciência, Produtos, Indicações) continuam no servidor; quando precisam
  de um CTA que abre o modal, usam `<AccreditationButton>`.
- **Conteúdo mora em `src/data/`**, tipado, nunca hard-coded no JSX. Texto novo
  de produto/protocolo/caso entra no módulo de dados correspondente.
- **Tailwind only.** `style={{...}}` só para valores genuinamente dinâmicos
  (ex.: `flexGrow` proporcional aos frascos, `--tilt` das caixas do hero).
- Classes de cor por enzima ficam resolvidas estaticamente em
  `src/data/enzymes.ts` (`dotClass`, `barClass`, `pillClass`, `headingClass`) —
  nunca montar nome de classe por concatenação, o Tailwind não extrai.
- **Imagens sempre via `next/image`** com `sizes`. Renders de produto usam
  `width`/`height` reais + `drop-shadow-*` (nunca `shadow-*`). `PhotoSlot` usa
  `fill` e mostra um frame com legenda enquanto a foto não chega.
- `globals.css` guarda só o que utilitário não expressa: tokens `@theme`,
  keyframes, esconder a scrollbar do carrossel e o reveal-no-hover das
  Indicações.

## Sistema visual

- **Tema claro/escuro** via `next-themes` (`attribute="class"`, sem
  `enableSystem`). Tailwind v4 não tem `tailwind.config.ts` — a estratégia de
  classe é declarada em `globals.css` com
  `@custom-variant dark (&:where(.dark, .dark *))`.
- **Tokens semânticos** (é o que vira com o tema, definidos em `:root` / `.dark`
  e expostos por `@theme inline`). **Componentes usam estes, não as cores de
  marca:** `canvas` (fundo da página), `panel` (seções em faixa),
  `card` (cards elevados), `content` (texto/hairline sobre canvas),
  `on-panel` (texto sobre faixa), `accent` / `accent-panel` (eyebrows),
  `action` / `action-fg` / `action-hover` (botão primário).
  No escuro o navy vira o fundo e as faixas sobem para `#112233`, preservando o
  ritmo das seções em vez de achatar tudo.
- **Cores de marca fixas** (pixel-sampled, nunca mudam com o tema porque
  identificam produto): `navy` `#12283C`, `navy-deep` `#0B1D2C`, `cream`
  `#F6F3EC`, `gold` `#C9A63E` (Slim+), `mustard` `#B8823A` (Drain+),
  `bronze` `#8C6F4E` (Smooth+), `gold-deep` `#96781E` (Slim+ sobre branco).
- `dark:` só onde um token não resolve — ex.: `bg-canvas dark:bg-card` para
  inverter elevação, `text-gold-deep dark:text-gold` por contraste, sombras.
- **Contraste**: texto pequeno/mono sobre canvas claro → opacidade ≥ 0.75.
  Sobre faixa escura, texto claro vai de ~0.5 (label mono) a ~0.86 (parágrafo).
- **Tipografia**: `font-display` = Sora 600/700 (headlines, wordmark),
  `font-sans` = Manrope 400–600 (corpo, UI, nav), `font-mono` = JetBrains Mono
  500 (eyebrows, labels técnicos, códigos de enzima, preços na lista).
- **Motivo de marca**: círculo/esfera dourada (radial-gradient) no hero e anéis
  concêntricos em outline nos fundos navy — ecoa o design da caixa.
- **Animação**: `animate-fade-up` (texto do hero, painel de protocolo) e
  `animate-rise-in` (caixas do hero, com `--tilt` por caixa). Nada mais.
  `prefers-reduced-motion` é respeitado globalmente.
- **Breakpoint próprio `wide` (1180px)**, onde o nav vira hambúrguer, o bento de
  Indicações vira 4 colunas e o configurador de Protocolos vira duas colunas.
  Os demais breakpoints padrão do Tailwind seguem disponíveis.
- Grids fluidas continuam usando
  `grid-cols-[repeat(auto-fit,minmax(Npx,1fr))]` onde não há mudança
  estrutural.

## Seções (ordem em `page.tsx`)

1. `SiteHeader` — wordmark, nav, CTA de credenciamento, menu mobile.
2. `#hero` — headline, subheadline, CTAs, trust strip, 3 caixas empilhadas.
3. `#ciencia` — fundo navy, tabela de comparação recombinante × origem animal.
4. `#produtos` — 3 cards (Slim+/Smooth+/Drain+) com render sangrando na borda.
5. `#casos` — fundo navy, tabs por categoria + carrossel com scroll-snap,
   setas e dots. Cada caso tem dois `PhotoSlot` (antes/depois, 3:4).
6. `#indicacoes` — bento; "Perfil Facial" e "Gordura Localizada" ocupam duas
   colunas. Descrição revelada no hover junto com zoom da foto; em dispositivos
   sem hover real ela fica sempre visível (`@media (hover: hover)`).
7. `#protocolos` — configurador: lista de 6 kits (pills no mobile, índice com
   preço no desktop) + painel com composição, total de frascos, preço e CTA.
8. `#faq` — informações regulatórias + acordeão de FAQ + disclaimer.
9. `SiteFooter` — contatos Aura Medical, pbserum, farmacovigilância.

## Decisões de negócio (não perguntar de novo)

- Marca da página: Aura Medical (distribuidor oficial pbserum no Brasil).
- Conversão: geração de lead (não e-commerce). CTA "Seja uma Clínica
  Credenciada" abre o **modal** de credenciamento, sem sair da página.
- Preços reais em R$ por kit; a vitrine mostra total **e** preço por frasco
  (R$ 390/un., `PRICE_PER_VIAL`).
- Tom: autoridade científica + persuasão comercial (B2B premium).
- FAQ usa placeholders explícitos ("consulte o time comercial") para pedido
  mínimo e prazos — números reais não foram enviados, **não inventar**.
- Casos clínicos: `PhotoSlot` vazio até a foto chegar; legenda real (médico,
  país, nº de sessões) já está em `src/data/cases.ts`.

## Pendências conhecidas

- **Contato comercial** (WhatsApp/e-mail da Aura Medical): ainda não informado.
  Placeholder sinalizado em `src/data/site.ts` e no rodapé do modal.
- **Destino do formulário de lead**: `AccreditationModal` só marca
  `isSubmitted` — falta o endpoint (Server Action ou API route).
- **PDFs em `public/docs/`** (`aura-medical-slide-kit-2026`,
  `prospecto-pbserum-plus`, `descricoes-casos`) ainda não estão linkados em
  nenhuma seção.
- `metadataBase` aponta para `https://auramedical.com.br` — confirmar o domínio
  final antes do deploy.

## Conteúdo de referência (extraído dos PDFs — não precisa reler)

**3 enzimas:** Slim+ = Lipase PB500 (*Thermus thermophilus*) → triglicerídeos,
gordura localizada. Smooth+ = Colagenases G&H PB220* patenteada
(*S. pyogenes*/*C. histolyticum*) → colágeno/septos fibróticos,
fibrose/cicatrizes. Drain+ = Hialuronidase PB3000 → polissacarídeos da MEC,
drenagem/edema. 10 frascos liofilizados por caixa.

**Áreas de aplicação:** Face — linha mandibular, papada/queixo duplo, linhas
finas e rugas. Corpo — abdômen, flancos, nádegas, coxas/alforjes, braços, papo
(dobra do sutiã), pernas/joelhos. Intervalo entre sessões: flacidez 4–6
semanas; adiposidades/celulite/cicatrizes/fibrose 2–3 semanas. Reconstituição:
2–5 ml de salina estéril 0,9% NaCl por frasco, + opcional 0,5–1 ml de lidocaína
2% sem epinefrina, usar imediatamente.

**6 protocolos/kits** (R$ 390/frasco) — ver `src/data/protocols.ts`:
Queixo Duplo, Perfilamento Facial e Gordura Localizada (4 frascos, R$ 1.560);
Celulite (10 frascos, R$ 3.900); Cicatrizes (4 frascos, R$ 1.560); Fibrose
Pós-Cirúrgica (5 frascos, R$ 1.950).

**Casos clínicos** — ver `src/data/cases.ts` (11 casos, 5 categorias).

**Regulatório obrigatório** — ver `src/data/safety.ts`. Contatos:
info@pbserum.com · +34 915 417 001 · proteosbiotech.com (Proteos Biotech S.L.,
Madrid). Eventos adversos: technosurveillance@pbserum.com. Dúvidas médicas:
medinfo@proteosbiotech.com. Distribuidor Brasil: auramedical.com.br.

## Diretriz de design

A skill `frontend-design` (instalada em `.claude/skills/frontend-design/`, clone
de `anthropics/claude-code` → `plugins/frontend-design`) rege as decisões visuais:
escolhas deliberadas de paleta, tipografia e layout ancoradas no assunto, um
elemento-assinatura por página, e restrição no resto. Ler antes de propor
mudanças visuais.
