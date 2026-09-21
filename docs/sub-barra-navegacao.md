# Especificação de Implementação: Sub-Barra de Navegação Contextual (In-Page Sub-Nav)

> **Documento de Orientação Técnica e de Design para o Codex / Time de Desenvolvimento**  
> **Projeto:** Aura Regenera (Aura Medical)  
> **Data:** Setembro de 2026  
> **Status:** Pronto para Implementação  

---

## 1. Proposta e Contexto

As páginas de linhas (`/linhas/pbserum`, `/linhas/la-cutanee`), de ciência (`/enzimas`) e de detalhe de catálogo apresentam conteúdos extensos e de alta densidade técnica (produtos, protocolos clínicos, dados biotecnológicos, casos de antes e depois, segurança sanitária e FAQ).

Para elevar a experiência do usuário (médicos e clientes exigentes) e facilitar o consumo desse conteúdo sem sobrecarregar a interface, propõe-se a criação de uma **Sub-Barra de Navegação Contextual (Sticky Pill Sub-Nav)**.

---

## 2. Objetivo

1. **Navegação Ágil e Rápida:** Permitir que o visitante salte instantaneamente para qualquer seção técnica (ex: pular direto para Protocolos ou Casos Clínicos).
2. **Orientação Cognitiva (Scrollspy):** Indicar continuamente ao usuário em qual seção da página ele se encontra durante a rolagem contínua.
3. **Estética de Luxo & Biotecnologia:** Manter o padrão visual da Aura Regenera (efeito vidro fosco `backdrop-blur`, microinterações sutis, suporte a Dark/Light mode e uso dinâmico das cores da linha como o dourado `#C59D3F` e acentos temáticos).
4. **Responsividade Universal:** Funcionar com perfeição no desktop (alinhada e compacta) e no mobile (trilho deslizável com touch `overflow-x-auto` sem quebrar o layout).

---

## 3. Decisão de Design: Sub-Barra Horizontal em Pílulas (Pill Tabs)

### Por que a Sub-Barra Horizontal foi a escolhida?
* **Em relação à Barra Lateral Flutuante:** A barra lateral sofre em notebooks comuns (1366px a 1440px) sobrepondo textos e fotos, além de ser inviável no mobile.
* **A Abordagem Horizontal com Abas em Pílula (Pill Tabs):**
  - Fica fixada (`sticky top-[altura-do-header]`) logo abaixo do cabeçalho principal.
  - Altura reduzida (~44px a 48px) para não roubar espaço vertical da viewport.
  - Cada item de ancoragem tem o formato visual de **pílula/badge**, combinando o formato moderno desejado com a ergonomia da navegação horizontal.
  - Suporte a scroll horizontal suave no celular sem esconder elementos da tela.

---

## 4. Mapeamento das Seções e IDs por Página

Para que os links funcionem corretamente, as páginas correspondentes devem ter as tags `<section>` com os respectivos `id=""` e a classe Tailwind de offset `scroll-mt-32` ou `scroll-mt-36` (compensando o header principal + sub-barra).

### 4.1. Linha Pbserum (`/linhas/pbserum`)

| ID da Seção | Rótulo (Label) | Descrição do Bloco |
| :--- | :--- | :--- |
| `visao-geral` | **Visão Geral** | Hero com título Pbserum, métricas (3 produtos, 6 protocolos, 9 casos) e imagem principal. |
| `produtos` | **Produtos** | Grade de ampolas recombinantes (`Slim+`, `Smooth+`, `Drain+`). |
| `protocolos` | **Protocolos** | Componente interativo `ProtocolShowcase` (kits e indicações de tratamento). |
| `casos-clinicos`| **Casos Clínicos**| Resultados documentados (Antes e Depois com número de sessões). |
| `ciencia` | **Ciência** | Card de transição para biotecnologia recombinante / link para `/enzimas`. |
| `seguranca` | **Segurança** | Recomendações farmacêuticas e notas de segurança clínica. |
| `faq` | **FAQ** | Acordeão com dúvidas frequentes sobre Pbserum e registro sanitário. |

> *Nota:* Se preferir uma sub-barra mais enxuta, `seguranca` e `faq` podem ser agrupados na pílula **"Segurança & FAQ"** apontando para `#seguranca`.

---

### 4.2. Linha La Cutanée (`/linhas/la-cutanee`)

| ID da Seção | Rótulo (Label) | Descrição do Bloco |
| :--- | :--- | :--- |
| `visao-geral` | **Visão Geral** | Hero com conceito dermocosmético, água termal e bioativos. |
| `produtos` | **Catálogo** | Grade de produtos dermatológicos faciais e corporais. |
| `filosofia` | **Manifesto** | Missão, Visão e Valores da marca. |
| `diferenciais` | **Diferenciais** | Nanotecnologia aplicada, testes dermatológicos, fototipos e selos. |
| `seguranca` | **Segurança & FAQ**| Orientações dermatológicas e dúvidas frequentes. |

---

### 4.3. Ciência Pbserum / Enzimas Recombinantes (`/enzimas`)

| ID da Seção | Rótulo (Label) | Descrição do Bloco |
| :--- | :--- | :--- |
| `inicio` | **Introdução** | Hero de biotecnologia recombinante e síntese biológica. |
| `biotecnologia` | **Biotecnologia**| Capítulos interativos (DNA Recombinante, Liofilização, Pureza). |
| `registro-anvisa`| **ANVISA** | Processos regulatórios individuais de cada enzima na ANVISA. |
| `portfolio` | **Enzimas** | Apresentação comparativa de Hialuronidase, Colagenase e Lipase. |
| `mecanismo` | **Mecanismos** | Ação celular na quebra de fibrose, adipócitos e colagênese. |
| `artigos` | **Evidências** | Estudos clínicos internacionais e bibliografia científica. |

---

### 4.4. Página Inicial / Home (`/`)

| ID da Seção | Rótulo (Label) | Descrição do Bloco |
| :--- | :--- | :--- |
| `inicio` | **Início** | Hero institucional Aura Regenera. |
| `linhas` | **Linhas** | Blocos de destaque para Pbserum e La Cutanée. |
| `destaques` | **Destaques** | Produtos e protocolos mais procurados. |
| `credenciamento`| **Área Médica** | Seção de cadastro para profissionais de saúde credenciados. |
| `faq` | **Dúvidas** | FAQ institucional sobre pedidos, prazos e políticas. |

---

### 4.5. Detalhe de Produto (`/produtos/[slug]`)

| ID da Seção | Rótulo (Label) | Descrição do Bloco |
| :--- | :--- | :--- |
| `visao-geral` | **Visão Geral** | Galeria de imagens, título, categoria e apresentação. |
| `comprar` | **Comprar** | Painel com preço, credenciamento profissional e botão de checkout. |
| `detalhes` | **Composição** | Ativos da fórmula, benefícios e tecnologia aplicada. |
| `modo-de-uso` | **Aplicação** | Protocolo de preparo e recomendações técnicas. |
| `casos-clinicos`| **Casos** | Resultados clínicos documentados para este produto. |
| `relacionados` | **Relacionados** | Itens complementares da mesma linha. |

---

### 4.6. Detalhe de Protocolo (`/protocolos/[slug]`)

| ID da Seção | Rótulo (Label) | Descrição do Bloco |
| :--- | :--- | :--- |
| `visao-geral` | **Visão Geral** | Nome do protocolo, indicação e quantidade de sessões. |
| `composicao` | **Composição** | Tabela de ampolas necessárias e dosagens. |
| `reconstituicao`| **Preparo** | Passo a passo de reconstituição farmacêutica. |
| `resultados` | **Resultados** | Evolução esperada do tratamento. |
| `casos-clinicos`| **Antes & Depois**| Galeria clínica específica deste protocolo. |
| `relacionados` | **Outros Kits** | Protocolos alternativos ou adjacentes. |

---

## 5. Diretrizes de Arquitetura e Código

### 5.1. Novo Componente: `src/components/navigation/SubNavBar.tsx`

Criar um componente cliente (`"use client"`) reutilizável com as seguintes características:

```typescript
export interface SubNavItem {
  id: string;      // ID da seção sem # (ex: 'protocolos')
  label: string;   // Texto exibido na pílula (ex: 'Protocolos')
}

export interface SubNavBarProps {
  items: SubNavItem[];
  brandLabel?: string;     // Ex: 'Pbserum' ou 'La Cutanée'
  accentColor?: string;    // Classe ou CSS var para a cor ativa
  className?: string;
}
```

### 5.2. Lógica de Scrollspy com `IntersectionObserver`

Para acender a pílula correspondente conforme o usuário rola a tela:

```typescript
useEffect(() => {
  const handleScroll = () => {
    // Detecta qual seção está mais próxima do topo (com offset do header)
    const offset = 140; // Altura combinada do header + sub-nav
    const scrollPosition = window.scrollY + offset;

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (!el) continue;
      const top = el.offsetTop;
      const height = el.offsetHeight;

      if (scrollPosition >= top && scrollPosition < top + height) {
        setActiveId(item.id);
        break;
      }
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
  return () => window.removeEventListener("scroll", handleScroll);
}, [items]);
```

### 5.3. Efeito Visual e Estilização Tailwind

* **Container Sticky:**
  ```html
  <nav
    aria-label="Navegação interna da página"
    className="sticky top-[72px] sm:top-[80px] z-40 w-full border-b border-content/8 bg-canvas/85 backdrop-blur-xl transition-all duration-200"
  >
    <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 sm:px-8 py-2.5">
      {/* Nome ou Badge da Linha à Esquerda */}
      <span className="hidden sm:inline-block font-display font-semibold text-sm tracking-wide text-content/90">
        {brandLabel}
      </span>

      {/* Trilho de Pílulas com Scroll Horizontal no Mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeId === item.id
                ? "bg-(--line-accent,theme(colors.amber.600)) text-white shadow-sm"
                : "text-content/70 hover:text-content hover:bg-content/5"
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  </nav>
  ```

### 5.4. Regra Obrigatória nas Seções da Página
Toda `<section>` referenciada na sub-barra **deve** conter a classe:
```html
className="scroll-mt-32 sm:scroll-mt-36 ..."
```
Isso impede que o título da seção seja coberto pelo cabeçalho fixo quando o usuário clica na âncora.

---

## 6. Roteiro de Aplicação Passo a Passo com Codex

1. **Passo 1:** Criar o componente `src/components/navigation/SubNavBar.tsx` com o código base e suporte a `Scrollspy`.
2. **Passo 2:** Atualizar `src/app/linhas/[slug]/page.tsx`:
   - Adicionar IDs e `scroll-mt-36` nas seções (`#visao-geral`, `#produtos`, `#protocolos`, `#casos-clinicos`, `#ciencia`, `#seguranca`, `#faq`).
   - Importar e renderizar `<SubNavBar />` logo abaixo do `<SiteHeaderServer />` ou dentro de `<LineScope>`.
3. **Passo 3:** Atualizar `src/app/enzimas/page.tsx` para incluir os IDs correspondentes às seções científicas.
4. **Passo 4:** Testar no navegador a transição de rolagem suave (`scroll-behavior: smooth`) e validar a experiência em tela mobile (375px) e desktop (1440px).
