// arquivo: centralização da busca db
// local: src\lib\getCampaign.ts

import {eq, inArray} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, worlds, masters, characters, characterStatus, characterItems, campaignLogs, chatMessages} from '@/db/schema';
import {resolveWorld} from '@/lib/resolveWorld';
import type {Campaign} from '@/types/campaign';

export async function getCampaign(room: string): Promise<Campaign | null> {
  const [campaignRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));

  if (!campaignRow) return null;

  const [masterRow] = await db.select().from(masters).where(eq(masters.room, room));
  const [worldRow] = await db.select().from(worlds).where(eq(worlds.id, campaignRow.worldId));
  const world = worldRow ? resolveWorld(worldRow) : null;

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
    world: world,
    master: {
      system: masterRow.system,
      model: masterRow.model,
      modelImg: masterRow.modelImg,
      apiKey: masterRow.apiKey,
      url: masterRow.url,
      contextSize: masterRow.contextSize,
      temperature: masterRow.temperature,
      repeatPenalty: masterRow.repeatPenalty,
      numPredict: masterRow.numPredict,
      personality: masterRow.personality,
    },
    chars: charactersWithDetails,
  };
}