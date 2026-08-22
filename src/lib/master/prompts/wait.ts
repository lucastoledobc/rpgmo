// arquivo: Instrução para uma ação simples
// local: src\lib\master\prompts\action0.ts

import {Status} from '@/types/campaign';
import type {ActionPayload} from '@/types/master';
import type {ChatMessage} from '@/types/master';

export function wait(status: Status, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {
  return `\nAcelere a narrativa resumindo o tempo transcorrido.`;
}