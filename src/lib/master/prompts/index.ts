// arquivo: monta a instrução final
// local: src\lib\campaign.master\prompts\index.ts

import type {Status, Master, Campaign} from '@/types/campaign';
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

import {findWorldExcerpt} from '@/lib/resolveWorld'
import {buildHistory} from '@/lib/master/history';
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


export async function callMaster({payload, campaign}: {payload: ActionPayload, campaign: Campaign}): Promise<string> {

  let type = 'text';
  let instruction = '';
  let res: {text: string, interactionId?: string, error?: boolean}

  campaign.status = campaign.status ?? ({} as Status)
  campaign.master = campaign.master ?? ({} as Master)

  const chatHistory = campaign.log ? buildHistory({logRows: campaign.log, types: ['ic'], charBudget: 2000, contiguousOnly: false}) : [];
  chatHistory.push({type: 'player', text: `${payload.char.name ?? ''}: ${payload.action}`})
  console.log("\nchatHistory: "+JSON.stringify(chatHistory)+"\n")

  if (campaign.status.category === 'AÇÃO_COMPLEXA' && !payload.dice) {

    const excerpt = findWorldExcerpt('rules', campaign.status.object ?? '', campaign.world);
    const builder = PROMPT_BUILDERS['DICE'];
    instruction = builder(campaign.status, payload, chatHistory, excerpt)

    res = await narrate({type, master: campaign.master, chatHistory, instruction});
    
    campaign.status.dice = res.text
    payload.type = 'system';
    return 'Dados necessários';
  }

  // Busca o trecho relevante (ex: o NPC específico que o jogador citou).
  const excerpt = findWorldExcerpt(campaign.status.objectType, campaign.status.object ?? '', campaign.world);

  // Pega a função certa pra essa categoria e gera a instrução específica
  const builder = PROMPT_BUILDERS[campaign.status.category ?? ''];
  instruction = builder
    ? builder(campaign.status, payload, chatHistory, {...campaign.world, excerpt})
    : 'O sistema não entendeu a ação do jogador, peça para ele enviar novamente com outras palavras.';

  console.log(`callMaster: Chamando Mestre ${campaign.master.system} \ntipo ${campaign.status.category}\ninstrução: ${instruction} `)
  if (campaign.status.category === 'CONVERSA' || campaign.status.category === 'COMBATE') {
    type = 'chat';
    campaign.status.instruction = instruction;
    res = await narrate({type, master: campaign.master, chatHistory, instruction});

    if (res.interactionId) {campaign.status.interactionId = res.interactionId;}

    payload.type = 'system'

    return `Modal de ${campaign.status.category} iniciado`;
  }
  else if (campaign.status.category === 'AÇÃO_COMPLEXA') {

    res = await narrate({type, master: campaign.master, chatHistory, instruction});
    
    if (!res.error) {
      campaign.status.id = false;
      campaign.status.dice = ''
    }
  }
  else if (campaign.status.category === 'COMBATE') {
    campaign.status.context = `${payload.char.name} entrou em combate com um ${campaign.status.object ? campaign.status.object : campaign.status.objectType}.`
    campaign.status.objects = [payload.char, excerpt]

    return `Modal de ${campaign.status.category} iniciado`;
  }
  else {
    res = await narrate({type, master: campaign.master, chatHistory, instruction});
    campaign.status.id = false;
  }

  if (res.error) payload.type == 'error'

  return res.text;
}