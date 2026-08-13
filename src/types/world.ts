// arquivo: tipos dos objetos do mundo
// local: src\types\worlds.ts

export interface Place {
  type: string;
  name: string;
  description: string;
  monsters?: string[];
  places?: Place[];
}

export interface Npc {
  id: string;
  name: string;
  history?: string;
  motivation?: string;
  likelyLocation?: string;
  status?: {name: string; value: number; max?: number}[];
}

export interface Monster {
  type: string;
  hpBase: number;
  attack: string | string[];
  skills?: string[];
  behavior?: string;
}

export interface Item {
  type: string;
  name: string;
  description?: string;
  properties?: {status: string; value: number}[];
  price?: number;
}

export interface Group {
  type: string;
  name: string;
  leader?: string;
  data?: string;
}

export interface Plot {
  title: string;
  phase: number;
  phases: string[];
}

export interface World {
  id: number
  title: string
  version: string
  theme?: string
  rules: any
  places?: Place[]
  history?: any
  npcs?: Npc[]
  monsters?: Monster[]
  items?: Item[]
  groups?: Group[]
  plots?: Plot[]
}