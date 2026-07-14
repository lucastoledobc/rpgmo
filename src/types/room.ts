// arquivo: define o formato de personagem "montado" (com status e itens já aninhados)
// local: src\types\room.ts

export interface CharacterStatus {
  id: number;
  name: string;
  value: number;
  max: number | null;
  type: 'attribute' | 'resource';
}

export interface CharacterItem {
  id: number;
  name: string;
  slot: 'equip' | 'backpack';
  quantity: number;
}

export interface CharacterWithDetails {
  id: string;
  name: string | null;
  age: number | null;
  race: string | null;
  class: string | null;
  history: string | null;
  status: CharacterStatus[];
  items: CharacterItem[];
}

export interface RoomDetails {
  room: {
    id: string;
    createdAt: Date;
    lastActivityAt: Date;
  };
  adventure: {
    id: number;
    title: string;
    worldId: number;
    timeline: string | null;
    createdAt: Date | null;
  };
  world: {
    id: number;
    title: string;
    theme: string | null;
    version: string;
  };
  master: {
    system: string;
    model: string;
    contextSize: number | null;
    temperature: number | null;
    repeatPenalty: number | null;
    numPredict: number | null;
    personality: string | null;
  };
  characters: CharacterWithDetails[];
}