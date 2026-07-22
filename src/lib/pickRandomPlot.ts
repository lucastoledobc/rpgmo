// Escolhe um plot aleatório entre os disponíveis no mundo de origem,
// devolvendo já serializado (mesmo formato — array JSON com 1 item),
// para a cópia da sala nascer com um único enredo fixo.
export function pickRandomPlot(plotsJson: string | null): string | null {
  if (!plotsJson) return null;

  try {
    const plots = JSON.parse(plotsJson);
    if (!Array.isArray(plots) || plots.length === 0) return null;

    const chosen = plots[Math.floor(Math.random() * plots.length)];
    return JSON.stringify([chosen]);
  }
  catch {
    return null;
  }
}