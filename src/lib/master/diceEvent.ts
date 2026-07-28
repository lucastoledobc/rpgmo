// arquivo: Pega a instrução anterior e 
// local: src\lib\master\diceEvent.ts

import type {ActionPayload} from '@/types/adventure';
import type {ActionType} from '@/types/adventure';

export function diceEvent(payload: ActionPayload, actionAnalyzed: ActionType, oldAction: any) {
    let parsed = JSON.parse(oldAction)
    payload.dice = Number(parsed.object)
    Object.assign(actionAnalyzed, parsed);
}