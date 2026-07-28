// arquivo: monta a instrução final
// local: src\lib\master\prompts\index.ts

import type {ActionPayload, State} from '@/types/adventure';
import type {Master} from '@/types/master';

import {action0} from './action0';
import {action1} from './action1';
import {apresentation} from './apresentation';
import {combat} from './combat';
import {description} from './description';
import {itemUse} from './itemUse';
import {rules} from './rules';
import {startAdventure} from './startAdventure';
import {talk} from './talk';
import {wait} from './wait';

import {narrate} from '../narrate';


function parseField<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export function resolveWorld(worldRow: any): any {
  const world = {
    rules: worldRow.rules,
    history: parseField(worldRow.history, {}),
    places: parseField(worldRow.places, []),
    chars: parseField(worldRow.chars, []),
    monsters: parseField(worldRow.monsters, []),
    items: parseField(worldRow.items, []),
    groups: parseField(worldRow.groups, []),
    plot: parseField(worldRow.plots, []),
  };
  return world
}

// Cada categoria de ação tem sua própria função que devolve uma instrução específica
const PROMPT_BUILDERS: Record<string, (state: State, payload: ActionPayload, history: string, world: any) => string> = {
  AÇÃO_SIMPLES: action0,
  AÇÃO_COMPLEXA: action1,
  APRESENTAÇÃO: apresentation,
  DESCRIÇÃO: description,
  CONVERSA: talk,
  COMBATE: combat,
  USO_ITEM: itemUse,
  PASSAGEM_DE_TEMPO: wait,
  REGRA: rules,
  START: startAdventure,
};

// Dado o tipo de objeto (pessoa, lugar, monstro, item) e o nome que o jogador mencionou, procura esse item específico dentro da lista correspondente do mundo. Se não achar nada específico, devolve a lista inteira como fallback.
export function findWorldExcerpt(objectType: State['objectType'], objectName: string, world: any): any {
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

export async function callMaster({payload, state, master, worldRow, history}: {payload: ActionPayload, state: State, master: Master, worldRow: any, history: string}): Promise<string> {

  let type = '';
  let instruction = '';
  let res;

  const world = resolveWorld(worldRow);

  // Busca o trecho relevante (ex: o NPC específico que o jogador citou).
  const excerpt = findWorldExcerpt(state.objectType, state.object, world);

  // Pega a função certa pra essa categoria e gera a instrução específica
  const builder = PROMPT_BUILDERS[state.category];
  instruction = builder
    ? builder(state, payload, history, {...world, excerpt})
    : 'O sistema não entendeu a ação do jogador, peça para ele enviar novamente com outras palavras.';

  const chatHistory = {role: 'player', text: payload.action}

  console.log(`Chamando Mestre ${master.system}, tipo ${state.category}`)
  if (state.category == 'CONVERSA') {
    type = 'chat';
    state.instruction = instruction;
    res = await narrate({type, master, chatHistory, instruction});
    if (res.interactionId) {state.interactionId = res.interactionId;}

    payload.mode = 'oc'
    return 'Sala NPC aberta';
  }
  else {
    res = await narrate({type, master, chatHistory, instruction});
  }
  if (state.category == 'START') state.id = false;

  return res.text;
}