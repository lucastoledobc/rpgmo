// arquivo: define o formato da campanha
// local: src\types\room.ts

import type {Character, World} from "./world";


export interface State {
  id: boolean;
  category: string;
  object: string;
  objectType: 'rules' | 'place' | 'person' | 'monster' | 'none';
  dice: string | number;
  instruction: string | null;
  interactionId: string | null;
}

export interface Context {
  plot: number;
  text: string;
  objects: any[];
}

export interface Master {
  system: string | null;
  model: string | null;
  modelImg: string | null;
  apiKey: string | null;
  url: string | null;
  contextSize: number | null;
  numPredict: number | null;
  temperature: number | null;
  repeatPenalty: number | null;
  personality: string | null;
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

export interface CharacterWithDetails {
  id: string;
  name: string | null;
  age: number | null;
  race: string | null;
  class: string | null;
  history: string | null;
  appearance: string | null;
  status: CharacterStatus[];
  items: CharacterItem[];
}

interface Log {
  id: number;
  sender: string;
  charId: string | null;
  charName: string | null;
  text: string;
  sentAt: string;
}

export interface Campaign {
  data: {
    room: string;
    title: string;
    pass: string;
    worldId: number,
    state: State,
    context: Context,
    timeline: string,
    createdAt: Date | null;
    lastActivityAt: Date | null;
  };
  world: World | null;
  master: Master;
  characters: Character[];
  charStatus: CharacterStatus[];
  charItems: CharacterItem[];
  log: Log[];
  chat: any[];
}

