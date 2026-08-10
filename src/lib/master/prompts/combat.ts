// arquivo: Instrução para combate
// local: src\lib\master\prompts\action0.ts

import type {ActionPayload, ActionType} from '@/types/master';
import type {ChatMessage} from '@/types/master';

export function combat(actionAnalyzed: ActionType, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {
  return `\nAtaque a: ${actionAnalyzed.object || 'um inimigo'} e Tirou . Calcule o resultado baseado em ${world.rules} e descreva o impacto de forma visceral. Se não tiver valores, peça para o jogador jogar o dado.`;
}