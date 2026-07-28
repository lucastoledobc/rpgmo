// arquivo: prepara os histórico do log para ir pro mestre
// local: src\lib\master\history.ts

import type {ChatMessage} from '@/types/master';

// Reconstrói o histórico da conversa ATUAL com o NPC — necessário pro Ollama,
// que não tem memória própria entre chamadas (diferente do Gemini, que usa
// interactionId do lado do servidor).
export function buildChatHistory(
  fullLogDesc: {type: string; text: string}[], // já ordenado do mais recente pro mais antigo
  charBudget: number = 2000
): ChatMessage[] {
  // 1. isola só o bloco mais recente de mensagens 'npc' — pára no primeiro
  //    tipo diferente, que marca onde essa conversa começou
  const sessionDesc: {text: string}[] = [];
  for (const entry of fullLogDesc) {
    if (entry.type !== 'npc') break;
    sessionDesc.push(entry);
  }

  // 2. corta por orçamento de caracteres, mantendo as mensagens mais recentes
  const trimmedDesc: {text: string}[] = [];
  let used = 0;
  for (const entry of sessionDesc) {
    if (used + entry.text.length > charBudget) break;
    trimmedDesc.push(entry);
    used += entry.text.length;
  }

  // 3. volta pra ordem cronológica e atribui o papel por posição alternada
  //    (jogador sempre grava antes do mestre, par a par)
  return trimmedDesc.reverse().map((entry, i) => ({
    role: i % 2 === 0 ? 'player' : 'master',
    text: entry.text,
  }));
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

