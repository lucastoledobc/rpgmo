// arquivo: monta a instrução final
// local: src\lib\master\prompts\index.ts

import type {Status, Master} from '@/types/campaign';
import type {ActionPayload, ChatMessage} from '@/types/master';

import {action0} from './action0';
import {action1} from './action1';
import {apresentation} from './apresentation';
import {combat} from './combat';
import {description} from './description';
import {dice} from './dice';
import {rules} from './rules';
import {startAdventure} from './startAdventure';
import {talk} from './talk';
import {wait} from './wait';

import {findWorldExcerpt, resolveWorld} from '@/lib/resolveWorld'
import {narrate} from '@/lib/master/narrate';


// Cada categoria de ação tem sua própria função que devolve uma instrução específica
const PROMPT_BUILDERS: Record<string, (status: Status, payload: ActionPayload, chatHistory: ChatMessage[], world: any) => string> = {
  AÇÃO_SIMPLES: action0,
  AÇÃO_COMPLEXA: action1,
  APRESENTAÇÃO: apresentation,
  DESCRIÇÃO: description,
  CONVERSA: talk,
  COMBATE: combat,
  PASSAGEM_DE_TEMPO: wait,
  REGRA: rules,
  START: startAdventure,
  DICE: dice,
};


export async function callMaster({payload, status, master, worldRow, chatHistory}: {payload: ActionPayload, status: Status, master: Master, worldRow: any, chatHistory: ChatMessage[]}): Promise<string> {

  let type = '';
  let instruction = '';
  let res: {text: string, interactionId?: string}

  const world = resolveWorld(worldRow);

  if ((status.category === 'AÇÃO_COMPLEXA'
    || status.category === 'USO_ITEM')
    && typeof(status.dice) == 'string') {

    const excerpt = findWorldExcerpt('rules', status.object ?? '', world);
    const builder = PROMPT_BUILDERS['DICE'];
    instruction = builder(status, payload, chatHistory, excerpt)

    res = await narrate({type, master, chatHistory, instruction});
    
    status.dice = res.text
    payload.type = 'system';
    return 'Dados necessários';
  }

  // Busca o trecho relevante (ex: o NPC específico que o jogador citou).
  const excerpt = findWorldExcerpt(status.objectType, status.object ?? '', world);

  // Pega a função certa pra essa categoria e gera a instrução específica
  const builder = PROMPT_BUILDERS[status.category ?? ''];
  instruction = builder
    ? builder(status, payload, chatHistory, {...world, excerpt})
    : 'O sistema não entendeu a ação do jogador, peça para ele enviar novamente com outras palavras.';

  console.log(`Chamando Mestre ${master.system}, tipo ${status.category}`)
  if (status.category === 'CONVERSA' || status.category === 'COMBATE') {
    type = 'chat';
    status.instruction = instruction;
    res = await narrate({type, master, chatHistory, instruction});

    if (res.interactionId) {status.interactionId = res.interactionId;}

    payload.type = 'system'

    return `Modal de ${status.category} iniciado`;
  }
  else if ((status.category === 'AÇÃO_COMPLEXA'
    || status.category === 'USO_ITEM')
    && typeof(status.dice) == 'number') {

    res = await narrate({type, master, chatHistory, instruction});
    
    status.id = false;
    status.dice = ''
  }
  else if (status.category === 'COMBATE') {
    status.text = `${payload.char.name} entrou em combate com um ${status.object ? status.object : status.objectType}.`
    status.objects = [payload.char, excerpt]

    return `Modal de ${status.category} iniciado`;
  }
  else {
    res = await narrate({type, master, chatHistory, instruction});
    status.id = false;
  }

  return res.text;
}