// Arquivo: Lida com o livro/mundo
// local: src\lib\master\resolveWorld.ts

import type {Status} from '@/types/campaign';
import type {World} from '@/types/world';

function parseField<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export function resolveWorld(worldRow: any): World {
  const world = {
    id: worldRow.id,
    title: worldRow.title,
    version: worldRow.version,
    theme: worldRow.theme,
    rules: parseField(worldRow.rules, null),
    history: parseField(worldRow.history, []),
    places: parseField(worldRow.places, []),
    chars: parseField(worldRow.chars, []),
    monsters: parseField(worldRow.monsters, []),
    items: parseField(worldRow.items, []),
    groups: parseField(worldRow.groups, []),
    plots: parseField(worldRow.plots, []),
  };
  return world
}

// Dado o tipo de objeto (pessoa, lugar, monstro, item) e o nome que o jogador mencionou, procura esse item específico dentro da lista correspondente do mundo. Se não achar nada específico, devolve a lista inteira como fallback.
export function findWorldExcerpt(objectType: Status['objectType'], objectName: string, world: any): any {
  const searchIn = (list: any[] | undefined, nameFields: string[]) => {
    if (!list) return null;
    const target = objectName.toLowerCase();
    return list.find((item) => nameFields.some((f) => item[f]?.toLowerCase()?.includes(target))) || null;
  };

  switch (objectType) {
    case 'rules':
      return world.rules;
    case 'place':
      return searchIn(world.places, ['name']) || world.places;
    case 'person':
      return searchIn(world.chars, ['name']) || null;
    case 'monster':
      return searchIn(world.monsters, ['type']) || world.monsters;
    case 'item':
      return searchIn(world.items, ['name']) || null;
    default:
      return null;
  }
}