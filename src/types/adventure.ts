// arquivo: define o formato dos objetos de aventura
// local: src\types\adventure.ts

import {CharacterWithDetails} from './room'

export interface ActionPayload {
  playerName: string;
  char: CharacterWithDetails;
  action: string;
  dice: number;
  response: string;
  mode: 'system' | 'ic' | 'npc' | 'oc' | 'error';
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
  id: string;
  objects: any[];
}