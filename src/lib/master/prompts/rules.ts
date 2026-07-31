// arquivo: Instrução para uma ação simples
// local: src\lib\master\prompts\action0.ts

import type {ActionPayload, ActionType} from '@/types/adventure';
import type {ChatMessage} from '@/types/master';

export function rules(actionAnalyzed: ActionType, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {
  return `\nResponda sobre a regra baseado em: ${world.rules}.`;
}