// arquivo: Instrução para combate
// local: src\lib\master\prompts\action0.ts

import type {Status} from '@/types/campaign';
import type {ActionPayload} from '@/types/master';
import type {ChatMessage} from '@/types/master';

export function combat(status: Status, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {
  return `\nAtaque a: ${status.object || 'um inimigo'} e Tirou ${payload.dice}. Calcule o resultado baseado em ${world.rules} e descreva o impacto de forma visceral. Se não tiver valores, peça para o jogador jogar o dado.`;
}