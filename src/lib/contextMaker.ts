// arquivo: mantém o contexto da situação atual
// local: src\lib\contextMaker.ts

import type {ActionPayload, State} from '@/types/master'
import type {Master} from '@/types/master'

// Escolhe um plot aleatório entre os disponíveis no mundo de origem
export function pickRandomPlot(plotsJson: string | null): string | null {
  if (!plotsJson) return null;

  try {
    const plots = JSON.parse(plotsJson);
    if (!Array.isArray(plots) || plots.length === 0) return null;

    const chosen = plots[Math.floor(Math.random() * plots.length)];
    return JSON.stringify([chosen]);
  }
  catch {
    return null;
  }
}

export function contextMaker(payload: ActionPayload, state: State, master: Master) {
  if (state.category == 'START') {
    
  }
}