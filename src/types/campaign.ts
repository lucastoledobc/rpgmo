// arquivo: define o formato da campanha
// local: src\types\room.ts

import type {World} from "./world";


export interface Status {
  id?: boolean;
  category?: string;
  object?: string;
  objectType?: 'rules' | 'place' | 'person' | 'monster' | 'item' | 'none';
  dice?: string | number;
  instruction?: string | null;
  interactionId?: string | null;
  plot?: number;
  plotPhase?: number;
  text?: string;
  objects?: any[];
}

export interface Master {
  system?: string | null;
  model?: string | null;
  modelImg?: string | null;
  apiKey?: string | null;
  url?: string | null;
  personality?: string | null;
  contextSize?: number | null;
  numPredict?: number | null;
  temperature?: number | null;
  repeatPenalty?: number | null;
}

export interface CharacterStatus {
  id: number;
  type: 'attribute' | 'resource';
  name: string;
  value: number;
  max: number | null;
}

export interface CharacterItem {
  id: number;
  name: string;
  slot: 'equip' | 'backpack';
  quantity: number;
  weight: number | null;
}

export interface Character {
  id: number;
  name: string | null;
  age: number | null;
  race: string | null;
  role: string | null;
  history: string | null;
  appearance: string | null;
  status?: CharacterStatus[];
  items?: CharacterItem[];
}

export interface Log {
  id: number
  room: string
  sender: string
  charId: number | null
  charName: string | null
  type: string
  text: string
  sentAt: Date
}

export interface Chat {
  room: string
  sender: string
  text: string
  sentAt: Date
}

export interface Campaign {
  room?: string
  title?: string
  pass?: string
  status?: Status
  createdAt?: Date
  lastActivityAt?: Date
  worldId?: string
  world?: World
  master?: Master
  chars?: Character[]
  log?: Log[]
  chat?: Chat[]
}
