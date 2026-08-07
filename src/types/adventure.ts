// arquivo: define o formato dos objetos de aventura
// local: src\types\adventure.ts

import {CharacterWithDetails} from './room'

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
  objectType: 'rules' | 'place' | 'person' | 'monster' | 'item' | 'none';
}

export interface State {
  id: boolean;
  category: string;
  object: string;
  objectType: 'rules' | 'place' | 'person' | 'monster' | 'item' | 'none';
  dice: string | number;
  instruction: string | null;
  interactionId?: string | null;
}

export interface Context {
  plot: number;
  text: string;
  objects: any[];
}

export interface ChatMessage {
  role: 'player' | 'master';
  text: string;
}