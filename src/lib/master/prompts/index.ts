import type {ActionType} from '../classifyAction';
import {findWorldExcerpt} from '../worldExcerpt';
import {action0} from './action0';
import {action1} from './action1';
import {apresentation} from './apresentation';
import {combat} from './combat';
import {description} from './description';
import {itemUse} from './itemUse';
import {rules} from './rules';
import {talk} from './talk';
import {wait} from './wait';

const PROMPT_BUILDERS: Record<string, (action: ActionType, world: any) => string> = {
  AÇÃO_SIMPLES: action0,
  AÇÃO_COMPLEXA: action1,
  APRESENTAÇÃO: apresentation,
  DESCRIÇÃO: description,
  CONVERSA: talk,
  COMBATE: combat,
  USO_ITEM: itemUse,
  PASSAGEM_DE_TEMPO: wait,
  REGRA: rules,
};

export function buildInstruction(actionAnalyzed: ActionType, world: any): string {
  const excerpt = findWorldExcerpt(actionAnalyzed.objectType, actionAnalyzed.object, world);
  const builder = PROMPT_BUILDERS[actionAnalyzed.category];
  return builder ? builder(actionAnalyzed, {...world, excerpt}) : `\nApenas narre a reação do mundo à ação.`;
}