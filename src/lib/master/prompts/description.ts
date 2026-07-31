// arquivo: Instrução para uma descrição de algo 
// local: src\lib\master\prompts\action0.ts

import type {ActionPayload, ActionType} from '@/types/adventure';
import type {ChatMessage} from '@/types/master';

export function description(actionAnalyzed: ActionType, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {
  return `Você é um narrador de RPG. O personagem ${payload.char?.name} fez uma pergunta de algo e você precisa descrever.
  \nHISTÓRICO DAS ÚLTIMAS JOGADAS: ${history}.
  \nCONXTEXTO DA CENA ${world}
  \nO jogador acabou de encontrar ${actionAnalyzed.object}.
  \nDescrição dele: ${JSON.stringify(world.excerpt ?? world)}
  \n De 0 a 20, ele tirou ${payload.dice}. Responda a pergunta dele baseado no quanto ele tirou no dado.
  \nPara valores menores que 5: minta em alguns usos.
  \nPara valores entre 5 e 10: Dê poucos detalhes.
  \nPara valores entre 10 e 15: Dê mais detalhes.
  \nPara valores maiores que 15: Explique tudo perfeitamente.
  `;
}