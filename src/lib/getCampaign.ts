// arquivo: centralização da busca db
// local: src\lib\getCampaign.ts

import {eq, inArray} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, worlds, masters, characters, characterStatus, characterItems} from '@/db/schema';
import type {Campaign} from '@/types/campaign';

export async function getCampaign(room: string): Promise<Campaign | null> {
  const [campaignRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));

  if (!campaignRow) return null;

  const [masterRow] = await db.select().from(masters).where(eq(masters.room, room));
  const [worldRow] = await db.select().from(worlds).where(eq(worlds.id, campaignRow.worldId));
  const characterRows = await db.select().from(characters).where(eq(characters.room, campaignRow.room));
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
    data: {
      room: campaignRow.room,
      title: campaignRow.title,
      worldId: campaignRow.worldId,
      timeline: campaignRow.timeline,
      createdAt: campaignRow.createdAt,
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
    },
    characters: charactersWithDetails,
  };
}