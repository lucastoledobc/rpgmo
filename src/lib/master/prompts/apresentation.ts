// arquivo: Instrução para uma apresentação de algo
// local: src\lib\master\prompts\action0.ts

import type {ActionPayload, ActionType} from '@/types/adventure';
import type {ChatMessage} from '@/types/master';

export function apresentation(actionAnalyzed: ActionType, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {
  const head = `Você é um narrador de RPG. O jogador ${payload.char?.name} encontrou algo novo e precisa de uma apresentação.
  \nHISTÓRICO DAS ÚLTIMAS JOGADAS: ${history}.
  \nCONXTEXTO DA CENA ${world}.
  `;
  let inst;
  switch (actionAnalyzed.objectType) {
    case 'rules':
      inst = `Livro de regras: ${JSON.stringify(world.excerpt ?? world)}
      \n Responda a pergunta dele.`;
      break
    case 'place':
      inst = `\nO jogador acabou de chegar no local ${actionAnalyzed.object}.`;
      break
    case 'person':
      inst = `\nO jogador acabou de encontrar o personagem ${actionAnalyzed.object}.`;
      break
    case 'monster':
      inst = `\nO jogador acabou de encontrar o monstro ${actionAnalyzed.object}.`;
      break
    case 'item':
      inst = `\nO jogador acabou de encontrar o item ${actionAnalyzed.object}.`;
      break
    default: 
      inst = `\nO jogador acabou de encontrar ${actionAnalyzed.object}.`;
      break
  }
  return `${head}\n${inst}
  \nDescrição dele: ${JSON.stringify(world.excerpt ?? world)}
  \nFaça uma apresentação do que ele encontrou baseado na aparência.`;
}