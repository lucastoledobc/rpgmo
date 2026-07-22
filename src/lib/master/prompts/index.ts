// arquivo: monta a instrução final
// local: src\lib\master\prompts\index.ts

import type {ActionType} from '../classifyAction';
import {action0} from './action0';
import {action1} from './action1';
import {apresentation} from './apresentation';
import {combat} from './combat';
import {description} from './description';
import {itemUse} from './itemUse';
import {rules} from './rules';
import {talk} from './talk';
import {wait} from './wait';

interface ActionPayload {
  playerName: string;
  char: {id: string; name: string | null} | null;
  action: string;
  mode: 'ic' | 'oc';
}

// Cada categoria de ação tem sua própria função que devolve uma instrução específica
const PROMPT_BUILDERS: Record<string, (object: string, char: any, history: string, world: any) => string> = {
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

// livro
function parseField<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  }
  catch {
    return fallback;
  }
}

// Dado o tipo de objeto (pessoa, lugar, monstro, item) e o nome que o jogador mencionou, procura esse item específico dentro da lista correspondente do mundo. Se não achar nada específico, devolve a lista inteira como fallback (assim a IA ainda tem algo pra se basear, mesmo sem achar o alvo exato).
function findWorldExcerpt(objectType: ActionType['objectType'], objectName: string, world: any): any {
  const searchIn = (list: any[] | undefined, nameFields: string[]) => {
    if (!list) return null;
    const target = objectName.toLowerCase();
    return list.find((item) => nameFields.some((f) => item[f]?.toLowerCase()?.includes(target))) || null;
  };

  switch (objectType) {
    case 'rules':
      return world.rules;
    case 'place':
      return searchIn(world.places, ['name']) || world.places;
    case 'person':
      return searchIn(world.chars, ['name']) || null;
    case 'monster':
      return searchIn(world.monsters, ['type']) || world.monsters;
    case 'item':
      return searchIn(world.items, ['name']) || null;
    default:
      return null;
  }
}

export function buildInstruction(actionAnalyzed: ActionType, payload: ActionPayload, history: string, worldRow: any): string {
  // Transforma as colunas cruas do banco em algo que dá pra usar.
  const world = {
    rules: worldRow.rules,
    history: parseField(worldRow.history, {}),
    places: parseField(worldRow.places, []),
    chars: parseField(worldRow.chars, []),
    monsters: parseField(worldRow.monsters, []),
    items: parseField(worldRow.items, []),
  };

  // Busca o trecho relevante (ex: o NPC específico que o jogador citou).
  const excerpt = findWorldExcerpt(actionAnalyzed.objectType, actionAnalyzed.object, world);

  // Pega a função certa pra essa categoria e gera a instrução específica
  const builder = PROMPT_BUILDERS[actionAnalyzed.category];
  const categoryInstruction = builder
    ? builder(actionAnalyzed.object, payload.char, history, {...world, excerpt})
    : 'O sistema não entendeu a ação do jogador, peça para ele enviar novamente com outras palavras.';

  return categoryInstruction;
}