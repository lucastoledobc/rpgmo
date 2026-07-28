// arquivo: Instrução para uma ação simples
// local: src\lib\master\prompts\action0.ts

import type {ActionPayload} from '@/types/adventure';
import type {ActionType} from '@/types/adventure';

export function wait(actionAnalyzed: ActionType, payload: ActionPayload, history: string, world: any): string {
  return `\nAcelere a narrativa resumindo o tempo transcorrido.`;
}