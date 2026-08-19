// arquivo: prepara os histórico do log para ir pro mestre
// local: src\lib\master\history.ts

import type {ChatMessage} from '@/types/master';
import type {Log} from '@/types/campaign';

// Reconstrói o histórico da conversa ATUAL com o NPC — necessário pro Ollama
export function buildHistory({logRows, types, charBudget, contiguousOnly}: {logRows: Log[] | null, types: string[], charBudget: number, contiguousOnly: boolean}): ChatMessage[] {

  // filtra pelos tipos pedidos, respeitando o modo
  const filtered: Log[] = [];
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
    type: entry.charId ? 'player' : 'master',
    text: `${entry.charName}: ${entry.text}`,
  }));

  // corta por orçamento de caracteres, mantendo as mais recentes
  const trimmedDesc: ChatMessage[] = [];
  let used = 0;
  for (const entry of messagesDesc) {
    if (used + entry.text.length + entry.type.length > charBudget) break;
    trimmedDesc.push(entry);
    used += entry.text.length;
  }

  // volta pra ordem cronológica
  return trimmedDesc.reverse();
}