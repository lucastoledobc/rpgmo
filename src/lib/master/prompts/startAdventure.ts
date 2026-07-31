// arquivo: gera o passo inicial da aventura
// local: src\lib\master\prompts\startAdventure.ts

import type {ActionPayload, ActionType} from '@/types/adventure';
import type {ChatMessage} from '@/types/master';

export function startAdventure(actionAnalyzed: ActionType, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {

    payload.playerName = "Mestre"

    const instruction = `
        Você é um mestre de RPG e uma aventura começou.
        \nEsse é o mundo ${JSON.stringify(world)}.
        \nEsses são os personagens ${payload.char}.
        \nEsse é o plot inicial: ${JSON.stringify(world.plot)}.
        \nEscolha um local para o personagem principal e explique pouco do que está acontecendo.
        \nTermine o texto com algo que aconteça com o jogar, para ele ter que agir.
    `;
    console.log(instruction)

    return instruction;
}