import type {ActionType} from '../classifyAction';

export function combat(object: string, char: any, history: string, world: any): string {
  return `\nAtaque a: ${object || 'um inimigo'}. Calcule o resultado baseado em ${world.rules} e descreva o impacto de forma visceral. Se não tiver valores, peça para o jogador jogar o dado.`;
}