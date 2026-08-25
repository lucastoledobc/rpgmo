// arquivo: Instrução para uma ação simples
// local: src\lib\master\prompts\action0.ts

import {Status} from '@/types/campaign';
import type {ActionPayload} from '@/types/master';
import type {ChatMessage} from '@/types/master';

export function rules(status: Status, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {
  return `\nResponda sobre a regra baseado em: ${JSON.stringify(world.rules)}.`;
}