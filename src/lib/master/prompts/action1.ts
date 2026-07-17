import type {ActionType} from '../classifyAction';

export function action1(action: ActionType, world: any): string {
  return `\nO jogador tenta algo arriscado com ${action.object || 'o ambiente'}. Peça uma rolagem de dados e narre o resultado.`;
}