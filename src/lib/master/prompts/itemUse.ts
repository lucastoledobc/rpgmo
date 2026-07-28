// arquivo: Instrução para uma ação simples
// local: src\lib\master\prompts\action0.ts

import type {ActionPayload} from '@/types/adventure';
import type {ActionType} from '@/types/adventure';

export function itemUse(actionAnalyzed: ActionType, payload: ActionPayload, history: string, world: any): string {
  return `\nO personagem interagiu com: ${actionAnalyzed.object}. ${JSON.stringify(world.excerpt ?? world)}. Descreva o resultado `;
}