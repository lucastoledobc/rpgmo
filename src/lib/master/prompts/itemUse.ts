import type {ActionType} from '../classifyAction';

export function itemUse(action: ActionType, world: any): string {
  return `\nO personagem interagiu com: ${action.object}. ${JSON.stringify(world.excerpt ?? world)}. Descreva o resultado `;
}