// arquivo: prepara os histórico do log para ir pro mestre
// local: src\lib\master\history.ts

import type {ChatMessage} from '@/types/adventure';

interface LogRow {
  charId: string | null;
  charName: string | null;
  type: string;
  text: string;
}

// Reconstrói o histórico da conversa ATUAL com o NPC — necessário pro Ollama
export function buildHistory(logRows: LogRow[] | null, types: string[], charBudget: number = 2000,contiguousOnly: boolean = false): ChatMessage[] {

  // filtra pelos tipos pedidos, respeitando o modo
  const filtered: LogRow[] = [];
  for (const entry of logRows ?? []) {
    const matches = types.includes(entry.type);

    if (!matches) {
      if (contiguousOnly) break; // sessão terminou aqui
      continue; // ignora e segue procurando mais linhas do tipo certo
    }

    filtered.push(entry);
  }

  // monta as mensagens (mais recente primeiro, igual veio)
  const messagesDesc: ChatMessage[] = filtered.map((entry) => ({
    role: entry.charId ? 'player' : 'master',
    text: `${entry.charName}: ${entry.text}`,
  }));

  // corta por orçamento de caracteres, mantendo as mais recentes
  const trimmedDesc: ChatMessage[] = [];
  let used = 0;
  for (const entry of messagesDesc) {
    if (used + entry.text.length + entry.role.length > charBudget) break;
    trimmedDesc.push(entry);
    used += entry.text.length;
  }

  // volta pra ordem cronológica
  return trimmedDesc.reverse();
}