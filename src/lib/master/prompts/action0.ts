// arquivo: Instrução para uma ação simples
// local: src\lib\master\prompts\action0.ts

import type {ActionPayload} from '@/types/adventure';
import type {ActionType} from '@/types/adventure';

export function action0(actionAnalyzed: ActionType, payload: ActionPayload, history: string, world: any): string {
  return `Você é um narrador de RPG e o jogador ${payload.char?.name} quer fazer algo simples.
  \nHISTÓRICO DAS ÚLTIMAS JOGADAS: ${history}.
  \nCONXTEXTO DA CENA ${world}.
  \nVerifique se é possível fazer essa ação.
  \nSe sim: Continue a narração como consequência.
  \nSe não: Explique o porquê é impossível fazer isso agora.`;
}