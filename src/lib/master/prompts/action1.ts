import type {ActionType} from '../classifyAction';

export function action1(object: string, char: any, history: string, world: any): string {
  return `\nO jogador tenta algo arriscado com ${object || 'o ambiente'}. Peça uma rolagem de dados e narre o resultado.`;
}