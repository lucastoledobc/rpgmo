// arquivo: Instrução para uma ação simples
// local: src\lib\master\prompts\action0.ts

import type {ActionPayload, ActionType} from '@/types/master';
import type {ChatMessage} from '@/types/master';

export function wait(actionAnalyzed: ActionType, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {
  return `\nAcelere a narrativa resumindo o tempo transcorrido.`;
}