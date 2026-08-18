// arquivo: define o formato dos objetos para o mestre
// local: src\types\master.ts

import {Character} from './campaign'

export interface ActionPayload {
  playerName: string;
  char: Character;
  action: string;
  dice: number;
  response: string;
  mode: 'system' | 'ic' | 'oc' | 'npc' | 'combat' | 'error'
}

export interface ActionType {
  category: string;
  object: string;
  objectType: 'rules' | 'place' | 'person' | 'monster' | 'item' | 'none';
}

export interface ChatMessage {
  type: 'player' | 'master';
  text: string;
}