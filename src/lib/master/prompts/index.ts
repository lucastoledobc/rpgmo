// arquivo: monta a instrução final
// local: src\lib\master\prompts\index.ts

import type {ActionPayload, State, Context} from '@/types/adventure';
import type {ChatMessage, Master} from '@/types/master';

import {action0} from './action0';
import {action1} from './action1';
import {apresentation} from './apresentation';
import {combat} from './combat';
import {description} from './description';
import {dice} from './dice';
import {itemUse} from './itemUse';
import {rules} from './rules';
import {startAdventure} from './startAdventure';
import {talk} from './talk';
import {wait} from './wait';

import {findWorldExcerpt, resolveWorld} from '@/lib/resolveWorld'
import {narrate} from '@/lib/master/narrate';


// Cada categoria de ação tem sua própria função que devolve uma instrução específica
const PROMPT_BUILDERS: Record<string, (state: State, payload: ActionPayload, chatHistory: ChatMessage[], world: any) => string> = {
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
  DICE: dice,
};


export async function callMaster({payload, state, context, master, worldRow, logRow}: {payload: ActionPayload, state: State, context: Context, master: Master, worldRow: any, logRow: any}): Promise<string> {

  let type = '';
  let instruction = '';
  let res: {text: string, interactionId?: string}

  const world = resolveWorld(worldRow);

  const chatHistory: ChatMessage[] = [{role: 'player', text: payload.action}]

  if ((state.category === 'AÇÃO_COMPLEXA'
    || state.category === 'USO_ITEM')
    && typeof(state.dice) == 'string') {

    const excerpt = findWorldExcerpt('rules', state.object, world);
    const builder = PROMPT_BUILDERS['DICE'];
    instruction = builder(state, payload, chatHistory, excerpt)

    res = await narrate({type, master, chatHistory, instruction});
    
    state.dice = res.text
    payload.mode = 'system';
    return 'Dados necessários';
  }

  // Busca o trecho relevante (ex: o NPC específico que o jogador citou).
  const excerpt = findWorldExcerpt(state.objectType, state.object, world);

  // Pega a função certa pra essa categoria e gera a instrução específica
  const builder = PROMPT_BUILDERS[state.category];
  instruction = builder
    ? builder(state, payload, chatHistory, {...world, excerpt})
    : 'O sistema não entendeu a ação do jogador, peça para ele enviar novamente com outras palavras.';

  console.log(`Chamando Mestre ${master.system}, tipo ${state.category}`)
  if (state.category === 'CONVERSA' || state.category === 'COMBATE') {
    type = 'chat';
    state.instruction = instruction;
    res = await narrate({type, master, chatHistory, instruction});

    if (res.interactionId) {state.interactionId = res.interactionId;}

    payload.mode = 'system'

    return `Modal de ${state.category} iniciado`;
  }
  else if ((state.category === 'AÇÃO_COMPLEXA'
    || state.category === 'USO_ITEM')
    && typeof(state.dice) == 'number') {

    res = await narrate({type, master, chatHistory, instruction});
    
    state.id = false;
    state.dice = ''
  }
  else if (state.category === 'COMBATE') {
    context.id = `${payload.char.name} entrou em combate com um ${state.object ? state.object : state.objectType}.`
    context.objects = [payload.char, excerpt]

    return `Modal de ${state.category} iniciado`;
  }
  else {
    res = await narrate({type, master, chatHistory, instruction});
    state.id = false;
  }

  return res.text;
}