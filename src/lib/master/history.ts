export function buildHistoryByBudget(log: {sender: string; charName: string | null; text: string}[], charBudget: number = 2000): string {
  const entries: string[] = [];
  let usedChars = 0;

  for (let i = log.length - 1; i >= 0; i--) {
    const entry = log[i];
    const line = `${entry.charName ?? entry.sender}: ${entry.text}`;
    if (usedChars + line.length > charBudget) break;
    entries.unshift(line);
    usedChars += line.length;
  }

  return entries.join('\n') || 'Nenhum histórico ainda.';
}