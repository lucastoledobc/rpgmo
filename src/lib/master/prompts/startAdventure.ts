// arquivo: gera o passo inicial da aventura
// local: src\lib\master\prompts\startAdventure.ts

import {Status} from '@/types/campaign';
import type {ActionPayload} from '@/types/master';
import type {ChatMessage} from '@/types/master';

export function startAdventure(status: Status, payload: ActionPayload, chatHistory: ChatMessage[], world: any): string {

    status.plot = Math.floor(Math.random() * world.plots.length);

    const instruction = `
        Você é um mestre de RPG e uma aventura começou.
        \nEsse é o mundo ${JSON.stringify(world)}.
        \nEsses são os personagens ${JSON.stringify(payload.char)}.
        \nEsse é o plot inicial: ${JSON.stringify(world.plots[status.plot])}.
        \nEscolha um local para o personagem principal e explique pouco do que está acontecendo.
        \nTermine o texto com algo que aconteça com o jogar, para ele ter que agir.
    `;
    console.log(instruction)

    return instruction;
}