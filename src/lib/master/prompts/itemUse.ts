// arquivo: Instrução para uma ação simples
// local: src\lib\master\prompts\action0.ts

import type {ActionPayload, ActionType} from '@/types/adventure';
import type {ChatMessage} from '@/types/master';

export function itemUse(actionAnalyzed: ActionType, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {
  return `\nO personagem interagiu com: ${actionAnalyzed.object}. ${JSON.stringify(world.excerpt ?? world)}. Descreva o resultado `;
}