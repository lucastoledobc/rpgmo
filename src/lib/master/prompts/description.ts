import type {ActionType} from '../classifyAction';

export function description(action: ActionType, world: any): string {
  return `\nO jogador encontrou ${action.object}. Veja se tem isso no mundo: ${JSON.stringify(world.excerpt ?? world)}. Descreva-o focando nos sentidos básicos.`;
}