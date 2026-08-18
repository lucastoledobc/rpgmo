// arquivo: Instrução para uma ação simples
// local: src\lib\master\prompts\action0.ts

import type {Status} from '@/types/campaign';
import type {ActionPayload} from '@/types/master';
import type {ChatMessage} from '@/types/master';

export function action0(status: Status, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {
  return `Você é um narrador de RPG e o jogador ${payload.char?.name} quer fazer algo simples.
  \nHISTÓRICO DAS ÚLTIMAS JOGADAS: ${history}.
  \nCONXTEXTO DA CENA ${world}.
  \nVerifique se é possível fazer essa ação.
  \nSe sim: Continue a narração como consequência.
  \nSe não: Explique o porquê é impossível fazer isso agora.`;
}