import type {ActionType} from '../classifyAction';

export function apresentation(action: ActionType, world: any): string {
  return `\nO jogador encontrou ${action.object}. Veja se tem isso no mundo: ${JSON.stringify(world.excerpt ?? world)}. Faça uma apresentação do que ele encontrou focando em mistérios.`;
}