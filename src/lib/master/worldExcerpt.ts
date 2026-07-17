import type {ActionType} from './classifyAction';

export function findWorldExcerpt(objectType: ActionType['objectType'], objectName: string, world: any): any {
  const searchIn = (list: any[] | undefined, nameFields: string[]) => {
    if (!list) return null;
    const target = objectName.toLowerCase();
    return list.find((item) => nameFields.some((f) => item[f]?.toLowerCase()?.includes(target))) || null;
  };

  switch (objectType) {
    case 'monster':
      return searchIn(world.monsters, ['tipo']) || world.monsters;
    case 'item':
      return searchIn(world.items, ['nome']) || null;
    case 'place':
      return searchIn(world.places, ['nome']) || world.places;
    case 'person':
      return searchIn(world.chars, ['nome']) || null;
    default:
      return null;
  }
}