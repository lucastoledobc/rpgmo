// arquivo: Instrução para uma apresentação de algo
// local: src\lib\master\prompts\action0.ts

import type {Status} from '@/types/campaign';
import type {ActionPayload} from '@/types/master';
import type {ChatMessage} from '@/types/master';

export function apresentation(status: Status, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {
  const head = `Você é um narrador de RPG. O jogador ${payload.char?.name} encontrou algo novo e precisa de uma apresentação.
  \nHISTÓRICO DAS ÚLTIMAS JOGADAS: ${history}.
  \nCONXTEXTO DA CENA ${world}.
  `;
  let inst;
  switch (status.objectType) {
    case 'rules':
      inst = `Livro de regras: ${JSON.stringify(world.excerpt ?? world)}
      \n Responda a pergunta dele.`;
      break
    case 'place':
      inst = `\nO jogador acabou de chegar no local ${status.object}.`;
      break
    case 'person':
      inst = `\nO jogador acabou de encontrar o personagem ${status.object}.`;
      break
    case 'monster':
      inst = `\nO jogador acabou de encontrar o monstro ${status.object}.`;
      break
    case 'item':
      inst = `\nO jogador acabou de encontrar o item ${status.object}.`;
      break
    default: 
      inst = `\nO jogador acabou de encontrar ${status.object}.`;
      break
  }
  return `${head}\n${inst}
  \nDescrição dele: ${JSON.stringify(world.excerpt ?? world)}
  \nFaça uma apresentação do que ele encontrou baseado na aparência.`;
}