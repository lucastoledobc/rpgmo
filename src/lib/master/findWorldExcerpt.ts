// Arquivo: Dado o tipo de objeto (pessoa, lugar, monstro, item) e o nome que o jogador mencionou, procura esse item específico dentro da lista correspondente do mundo. Se não achar nada específico, devolve a lista inteira como fallback.
// local: src\lib\master\findWorldExcerpt.ts

import type {ActionPayload} from '@/types/adventure';
import type {ActionType} from '@/types/adventure';

export function findWorldExcerpt(objectType: ActionType['objectType'], objectName: string, world: any): any {
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