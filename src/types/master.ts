// arquivo: define o formato dos objetos para o mestre
// local: src\types\master.ts

import {CharacterWithDetails} from './campaign'

export interface ActionPayload {
  playerName: string;
  char: CharacterWithDetails;
  action: string;
  dice: number;
  response: string;
  mode: 'system' | 'ic' | 'oc' | 'npc' | 'combat' | 'error';
}

export interface ActionType {
  category: string;
  object: string;
  objectType: 'rules' | 'place' | 'person' | 'monster' | 'none';
}

export interface ChatMessage {
  role: 'player' | 'master';
  text: string;
}