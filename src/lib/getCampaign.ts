// arquivo: centralização da busca db
// local: src\lib\getCampaign.ts

import {eq, inArray} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, worlds, masters, characters, characterStatus, characterItems} from '@/db/schema';
import {cache} from 'react';
import {resolveWorld} from '@/lib/resolveWorld';
import type {Campaign} from '@/types/campaign';

export const getCampaign = cache(async (room: string): Promise<Campaign | null> => {
  const [campaignRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));

  if (!campaignRow) return null;

  const [masterRow] = await db.select().from(masters).where(eq(masters.room, room));
  const [worldRow] = await db.select().from(worlds).where(eq(worlds.room, room));

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
    role: char.role,
    history: char.history,
    appearance: char.appearance,
    status: statusRows.filter((s) => s.charId === char.id) as any,
    items: itemRows.filter((i) => i.charId === char.id) as any,
  }));

  return {
    room: campaignRow.room,
    title: campaignRow.title,
    state: campaignRow.state ? JSON.parse(campaignRow.state) : undefined,
    context: campaignRow.context ? JSON.parse(campaignRow.context) : undefined,
    timeline: campaignRow.timeline ?? undefined,
    createdAt: campaignRow.createdAt,
    world: worldRow ? resolveWorld(worldRow) : undefined,
    master: masterRow ? {
      system: masterRow.system,
      model: masterRow.model,
      modelImg: masterRow.modelImg,
      url: masterRow.url,
      contextSize: masterRow.contextSize,
      temperature: masterRow.temperature,
      repeatPenalty: masterRow.repeatPenalty,
      numPredict: masterRow.numPredict,
      personality: masterRow.personality,
    } : undefined,
    chars: charactersWithDetails,
  };
});