// arquivo: lida com os erros possíveis
// local: 

import type {ActionPayload} from '@/types/master';
import type {ActionType} from '@/types/master';

export function handlingError(payload: ActionPayload, actionAnalyzed: ActionType) {
  payload.playerName = "Mestre";

  // verifica se a ação analisada tem uma categoria válida
  const validTypes = ['rules','place','person','monster','item','none'];
  if (!validTypes.includes(actionAnalyzed.objectType)) actionAnalyzed.objectType = 'none';

  // CONVERSA
  if (actionAnalyzed.category === 'CONVERSA') {
    if ( actionAnalyzed.object === '') {
    actionAnalyzed.category = 'OUTRO';
    payload.mode = 'error';
    payload.response = 'Erro: o mestre não entendeu com quem você quer conversar.'
      return
    }

    // coloca o nome do npc
    payload.playerName = actionAnalyzed.object 
  }

  // OUTRO
  if (actionAnalyzed.category === 'OUTRO') {
    payload.mode = 'error';
    return
  }

  return
}