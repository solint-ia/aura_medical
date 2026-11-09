/**
 * Converte um texto colado em itens de lista.
 *
 * O admin cola o conteúdo como veio da ficha do fornecedor ou de um PDF: com
 * marcadores (•, -, 1.), um item por linha, ou com linhas quebradas no meio de
 * uma frase. A regra:
 *
 * - Linha em branco e marcador sempre abrem item novo.
 * - Uma linha sem marcador continua o item anterior só quando ele não termina
 *   em pontuação e ela começa em minúscula: é a mesma frase quebrada.
 * - Vários "•" na mesma linha, ou uma linha única com ";", viram itens separados.
 */

const MARKER = /^(?:[-–—•·▪◦*●○►✓✔]|\d{1,2}[.)]|[a-z]\))\s*/i;
const ENDS_SENTENCE = /[.;:!?]$/;
const STARTS_LOWER = /^[a-zà-ÿ(]/;

function clean(item: string) {
  return item.replace(/\s+/g, " ").replace(/[;,]$/, "").trim();
}

function hasMarker(line: string) {
  // "1.5 ml" e "-10%" não são marcadores: o marcador vem seguido de espaço,
  // exceto os símbolos que nunca começam uma frase.
  const match = line.match(MARKER);
  if (!match) return false;
  return /\s$/.test(match[0]) || /^[•·▪◦●○►✓✔]/.test(line);
}

/** "• Vegano • Sulfato free •Cruelty free" vira uma linha por selo. */
function splitInlineBullets(line: string) {
  const parts = line.split(/\s*•\s*/).filter(Boolean);
  return parts.length > 1 ? parts.map((part) => `• ${part}`) : [line];
}

export function parseListText(text: string): string[] {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .flatMap(splitInlineBullets);
  const filled = lines.filter(Boolean);

  if (filled.length === 1) {
    const only = filled[0].replace(MARKER, "");
    const parts = only.split(/\s*;\s*/).map(clean).filter(Boolean);
    return parts.length > 1 ? parts : [clean(only)].filter(Boolean);
  }

  const items: string[] = [];
  let current: string | null = null;
  let afterBlank = false;

  for (const line of lines) {
    if (!line) {
      afterBlank = true;
      continue;
    }
    const marked = hasMarker(line);
    const startsItem =
      current === null || afterBlank || marked || ENDS_SENTENCE.test(current) || !STARTS_LOWER.test(line);
    const content = marked ? line.replace(MARKER, "") : line;

    if (startsItem) {
      if (current !== null) items.push(current);
      current = content;
    } else {
      current = `${current} ${content}`;
    }
    afterBlank = false;
  }
  if (current !== null) items.push(current);

  return items.map(clean).filter(Boolean);
}

/** O caminho inverso: um item por linha, para editar a lista como texto. */
export function listToText(items: string[]) {
  return items.join("\n");
}
