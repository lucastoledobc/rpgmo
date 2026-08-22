// arquivo: cria uma sala para uma campanha
// local: src\app\api\create\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, worldTemplates, worlds, masters, characters, characterStatus, characterItems, campaignLogs, chatMessages} from '@/db/schema';
import bcrypt from 'bcryptjs';
import type {Campaign} from '@/types/campaign';


async function generateRoomCode(): Promise<string> {
  let room = '';
  let available = false;

  while (!available) {
    room = Array.from({length: 6}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
    const [existing] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!existing) available = true;
  }

  return room;
}


export async function POST(request: Request) {
  try {
    const body: Campaign = await request.json();
    const {title, pass, status, createdAt, worldId, world, master, chars, log, chat} = body;

    if (!pass?.trim()) {
      return NextResponse.json({error: 'Senha é obrigatória.'}, {status: 400});
    }
    if (chars && !Array.isArray(chars)) {
      throw new Error('Campo "chars" da campanha está em formato inválido.');
    }

    const room = await generateRoomCode();
    const passHash = await bcrypt.hash(pass, 10);

    await db.transaction(async (tx) => {

      // ---------- campanha ----------
      await tx.insert(campaigns).values({
        room,
        title: title ?? 'Campanha sem título',
        passHash,
        status: status ? JSON.stringify(status) : null,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        lastActivityAt: new Date(),
      });

      // ---------- mundo ----------
      if (worldId) {
        const templateId = Number(worldId);
        const [template] = await tx.select().from(worldTemplates).where(eq(worldTemplates.id, templateId));

        if (!template) {
          throw new Error('Mundo não encontrado.');
        }

        const {id: _templateId, ...templateFields} = template;
        await tx.insert(worlds).values({room, ...templateFields});
      }
      else if (world) {
        await tx.insert(worlds).values({
          room,
          title: world.title ?? 'Mundo Personalizado',
          version: world.version ?? '1.00',
          theme: world.theme ?? null,
          rules: world.rules ? JSON.stringify(world.rules) : 'Regra básica: d20 para qualquer situação.',
          places: world.places ? JSON.stringify(world.places) : null,
          history: world.history ? JSON.stringify(world.history) : null,
          npcs: world.npcs ? JSON.stringify(world.npcs) : null,
          monsters: world.monsters ? JSON.stringify(world.monsters) : null,
          items: world.items ? JSON.stringify(world.items) : null,
          groups: world.groups ? JSON.stringify(world.groups) : null,
          plots: world.plots ? JSON.stringify(world.plots) : null,
        });
      }

      // ---------- mestre ----------
      await tx.insert(masters).values({
        room,
        system: master?.system ?? null,
        model: master?.model ?? null,
        apiKey: null,
        url: master?.url ?? null,
        contextSize: master?.contextSize ?? null,
        numPredict: master?.numPredict ?? null,
        temperature: master?.temperature ?? null,
        repeatPenalty: master?.repeatPenalty ?? null,
        personality: master?.personality ?? null,
      });

      // ---------- personagens restaurados (com status/itens) ----------
      // idMap: liga o id ANTIGO (string, do JSON restaurado) ao id NOVO 
      const idMap = new Map<number, number>();

      if (chars && chars.length > 0) {
        for (const c of chars) {
          const [inserted] = await tx.insert(characters).values({
            room,
            name: c.name ?? null,
            age: c.age ?? null,
            race: c.race ?? null,
            role: c.role ?? null,
            appearance: c.appearance ?? null,
            history: c.history ?? null,
          }).returning({id: characters.id});

          if (c.id) {
            idMap.set(c.id, inserted.id);
          }

          if (c.status && c.status.length > 0) {
            await tx.insert(characterStatus).values(
              c.status.map((s) => ({charId: inserted.id, type: s.type, name: s.name, value: s.value, max: s.max ?? null}))
            );
          }

          if (c.items && c.items.length > 0) {
            await tx.insert(characterItems).values(
              c.items.map((i) => ({charId: inserted.id, name: i.name, slot: i.slot, quantity: i.quantity, weight: i.weight ?? null}))
            );
          }
        }
      }

      // ---------- log e chat restaurados ----------
      if (log && log.length > 0) {
        await tx.insert(campaignLogs).values(
          log.map((entry) => ({
            room,
            sender: entry.sender,
            charId: entry.charId != null ? idMap.get(entry.charId) ?? null : null,
            charName: entry.charName,
            type: entry.type,
            text: entry.text,
            sentAt: new Date(entry.sentAt)
          }))
        );
      }

      if (chat && chat.length > 0) {
        await tx.insert(chatMessages).values(
          chat.map((entry) => ({
            room, 
            sender: entry.sender, 
            text: entry.text, 
            sentAt: new Date(entry.sentAt)}))
        );
      }
    });

    return NextResponse.json({success: true, room}, {status: 201});
  }
  catch (error) {
    console.error('Erro ao criar campanha:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar sala.';
    return NextResponse.json({error: message}, {status: 500});
  }
}