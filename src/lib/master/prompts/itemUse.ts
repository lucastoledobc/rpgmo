import type {ActionType} from '../classifyAction';

export function itemUse(object: string, char: any, history: string, world: any): string {
  return `\nO personagem interagiu com: ${object}. ${JSON.stringify(world.excerpt ?? world)}. Descreva o resultado `;
}