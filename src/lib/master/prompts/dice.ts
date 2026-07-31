// arquivo: Faz a leitura de qual dado deve ser lançado.
// local: src\lib\master\diceEvent.ts

import type {ActionPayload, ActionType} from '@/types/adventure';

export function dice(actionAnalyzed: ActionType, payload: ActionPayload, history: string, world: any): string  {
    const instruction = `
    Estamos em um jogo de RPG e o jogador falou ${payload.action}.\n
    Isso corresponde a uma uma ação complexa. Procure no livro qual dado ele deve jogar para essa situação.
    LIVRO:
    ${world}
    \n\n
    Retorne apenas uma mensagem do tipo NdX, onde N: é o número de dados e X é o tipo do dado, exemplo:\n
    O jogador deve jogar 2 dados de 20 lados: "2d20".\n
    O jogador deve jogar 1 d4: "1d4"`;
    
    return instruction;
}