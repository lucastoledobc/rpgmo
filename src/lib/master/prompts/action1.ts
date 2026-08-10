// arquivo: Instrução para uma ação complexa
// local: src\lib\master\prompts\action1.ts

import type {ActionPayload, ActionType} from '@/types/master';
import type {ChatMessage} from '@/types/master';

export function action1(actionAnalyzed: ActionType, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {
  return `Você é um narrador de RPG e o jogador ${payload.char?.name} tenta algo arriscado com ${actionAnalyzed.object || 'o ambiente'} e tirou ${payload.dice}.
  \nHISTÓRICO DAS ÚLTIMAS JOGADAS: ${history}.
  \nCONXTEXTO DA CENA ${world}.
  \nVerifique se é possível fazer essa ação.
  \nSe sim: Continue a narração como consequência.
  \nSe não: Explique o porquê é impossível fazer isso agora.`;
};