import type {ActionType} from '../classifyAction';

export function rules(object: string, char: any, history: string, world: any): string {
  return `\nResponda sobre a regra baseado em: ${world.rules}.`;
}