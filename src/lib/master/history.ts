// arquivo: prepara os histórico do log para ir pro mestre
// local: src\lib\master\history.ts

import type {ChatMessage} from '@/types/master';

// Reconstrói o histórico da conversa ATUAL com o NPC — necessário pro Ollama
export function buildNPCChatHistory(
  fullLogDesc: {charId: string, charName: string, type: string; text: string}[], // já ordenado
  charBudget: number = 2000
): ChatMessage[] {

  // isola só o bloco mais recente de mensagens 'npc' e adiciona as roles
  const sessionDesc: {role: 'player' | 'master', text: string}[] = [];
  for (const entry of fullLogDesc) {
    if (entry.type !== 'npc') break;
    sessionDesc.push({
      role: entry.charId ? 'player' : 'master',
      text: entry.charName+": "+entry.text,
    });
  }

  // corta por orçamento de caracteres, mantendo as mensagens mais recentes
  const trimmedDesc: {role: 'player' | 'master', text: string}[] = [];
  let used = 0;
  for (const entry of sessionDesc) {
    if (used + entry.text.length + entry.role.length > charBudget) break;
    trimmedDesc.push(entry);
    used += entry.text.length;
  }

  // volta pra ordem cronológica
  return trimmedDesc.reverse().map((entry) => (entry));
}


export function buildHistory(log: {charName: string | null; text: string}[], charBudget: number = 2000): string {
  const entries: string[] = [];
  let usedChars = 0;

  for (let i = log.length - 1; i >= 0; i--) {
    const entry = log[i];
    const line = `${entry.charName}: ${entry.text}`;
    if (usedChars + line.length > charBudget) break;
    entries.unshift(line);
    usedChars += line.length;
  }

  return entries.join('\n') || 'Nenhum histórico ainda.';
}

