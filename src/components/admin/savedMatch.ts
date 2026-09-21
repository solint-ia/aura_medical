type Row = Record<string, unknown>;

/**
 * O registro salvo corresponde ao que o painel enviou?
 *
 * Só olha o que foi enviado: o servidor devolve colunas a mais (ids das linhas
 * da galeria, datas, relações carregadas) e isso não significa diferença. Serve
 * para decidir se uma gravação que pareceu falhar — resposta perdida, conexão
 * cortada, conflito na segunda tentativa — na verdade já foi gravada.
 */
export function matchesSaved(sent: unknown, saved: unknown): boolean {
  if (sent === undefined) return true;

  if (Array.isArray(sent)) {
    return Array.isArray(saved) && sent.length === saved.length && sent.every((item, index) => matchesSaved(item, saved[index]));
  }

  if (sent !== null && typeof sent === "object") {
    if (saved === null || typeof saved !== "object" || Array.isArray(saved)) return false;
    return Object.entries(sent as Row).every(([key, value]) => matchesSaved(value, (saved as Row)[key]));
  }

  // Campo vazio: o painel manda "", o banco guarda null. É o mesmo nada.
  if (sent === null || sent === "") return saved === null || saved === "" || saved === undefined;

  return sent === saved || String(sent) === String(saved);
}
