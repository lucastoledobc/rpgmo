import type {ActionType} from '../classifyAction';

export function rules(action: ActionType, world: any): string {
  return `\nResponda sobre a regra baseado em: ${world.rules}.`;
}