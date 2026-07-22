// arquivo: centralização da busca db
// local: src\lib\getRoomData.ts

import {eq, inArray} from 'drizzle-orm';
import {db} from '@/db';
import {rooms, adventures, worlds, masters, characters, characterStatus, characterItems} from '@/db/schema';
import type {RoomDetails} from '@/types/room';

export async function getRoomData(roomId: string): Promise<RoomDetails | null> {
  const [roomRow] = await db.select().from(rooms).where(eq(rooms.id, roomId));

  if (!roomRow) return null;

  const [[adventureRow], [masterRow]] = await Promise.all([
    db.select().from(adventures).where(eq(adventures.roomId, roomId)),
    db.select().from(masters).where(eq(masters.roomId, roomId)),
  ]);

  if (!adventureRow) return null;

  const [worldRow] = await db.select().from(worlds).where(eq(worlds.id, adventureRow.worldId));

  const characterRows = await db.select().from(characters).where(eq(characters.adveId, adventureRow.id));
  const charIds = characterRows.map((c) => c.id);

  const [statusRows, itemRows] = charIds.length
    ? await Promise.all([
        db.select().from(characterStatus).where(inArray(characterStatus.charId, charIds)),
        db.select().from(characterItems).where(inArray(characterItems.charId, charIds)),
      ])
    : [[], []];

  const charactersWithDetails = characterRows.map((char) => ({
    id: char.id,
    name: char.name,
    age: char.age,
    race: char.race,
    class: char.class,
    history: char.history,
    appearance: char.appearance,
    status: statusRows.filter((s) => s.charId === char.id) as any,
    items: itemRows.filter((i) => i.charId === char.id) as any,
  }));

  return {
    room: {
      id: roomRow.id,
      createdAt: roomRow.createdAt,
      lastActivityAt: roomRow.lastActivityAt,
    },
    adventure: {
      id: adventureRow.id,
      title: adventureRow.title,
      worldId: adventureRow.worldId,
      timeline: adventureRow.timeline,
      createdAt: adventureRow.createdAt,
    },
    world: {
      id: worldRow.id,
      title: worldRow.title,
      theme: worldRow.theme,
      version: worldRow.version,
    },
    master: {
      system: masterRow.system,
      model: masterRow.model,
      contextSize: masterRow.contextSize,
      temperature: masterRow.temperature,
      repeatPenalty: masterRow.repeatPenalty,
      numPredict: masterRow.numPredict,
      personality: masterRow.personality,
      hasApiKey: Boolean(masterRow.apiKey),
    },
    characters: charactersWithDetails,
  };
}