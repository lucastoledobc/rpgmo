// arquivo: route da criação da sala
// local: src\app\api\create\route.ts

import {NextResponse} from 'next/server';
import {eq, and} from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import {db} from '@/db';
import {rooms, worlds, masters, adventures, characters, adventureLogs, chatMessages} from '@/db/schema';
import {pickRandomPlot} from '@/lib/pickRandomPlot';
import {generateCharId} from '@/lib/generateCharId';
import {encrypt} from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    let {
      title,
      pass,
      worldId,
      worldTitle,
      worldVersion,
      timeline,
      createdAt,
      plot,
      masterSystem,
      masterModel,
      masterKey,
      personality,
      chars,
      log,
      chat,
    } = await request.json();

    if (!title?.trim() || !pass?.trim()) {
      return NextResponse.json({error: 'Nome da sala e senha são obrigatórios.'}, {status: 400});
    }

    let roomId = '';
    let sId = false;
    while (!sId) {
      roomId = Array.from({length: 12}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join('');
      const [exist] = await db.select().from(rooms).where(eq(rooms.id, roomId));
      if (!exist) sId = true;
    }

    let sourceWorldId: number;

    if (worldTitle !== 'custom') {
      const [world] = await db.select().from(worlds).where(
        and(
          eq(worlds.title, worldTitle),
          eq(worlds.version, worldVersion)
        ));

      if (!world) {
        return NextResponse.json({error: `Mundo (${worldTitle}) versão(${worldVersion}) não encontrado.`}, {status: 404});
      }
      sourceWorldId = world.id;
    }
    else {
      if (!worldId) {
        return NextResponse.json({error: 'Nenhum livro foi carregado para o mundo personalizado.'}, {status: 400});
      }
      sourceWorldId = Number(worldId);
    }

    const [sourceWorld] = await db.select().from(worlds).where(eq(worlds.id, sourceWorldId));
    if (!sourceWorld) {
      return NextResponse.json({error: 'Mundo de origem não encontrado.'}, {status: 404});
    }

    const passHash = await bcrypt.hash(pass, 10);
    const keyHash = masterKey ? await encrypt(masterKey) : null;

    // Personagens restaurados de uma aventura antiga precisam de ids novos
    const restoredChars = chars && chars.length > 0
      ? await Promise.all(chars.map(async (c: any) => ({...c, id: await generateCharId()})))
      : [];

    await db.transaction(async (tx) => {

      await tx.insert(rooms).values({
        id: roomId,
        passHash,
        createdAt: new Date(),
        lastActivityAt: new Date(),
      });

      const {id: _templateId, ...worldFields} = sourceWorld;
      const [worldCopy] = await tx.insert(worlds).values({
        ...worldFields,
        plots: plot ? JSON.stringify([plot]) : pickRandomPlot(sourceWorld.plots),
      }).returning({id: worlds.id});

      const [newAdventure] = await tx.insert(adventures).values({
        roomId,
        title,
        worldId: worldCopy.id,
        timeline,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      }).returning({id: adventures.id});

      await tx.insert(masters).values({
        roomId,
        system: masterSystem,
        model: masterModel,
        apiKey: keyHash,
        contextSize: 4096,
        temperature: 0.85,
        repeatPenalty: 1.3,
        numPredict: 400,
        personality: personality || 'Mestre clássico de RPG, descritivo e justo.',
      });

      // Restaura dados antigos (Upload JSON) 
      if (restoredChars.length > 0) {
        const mappedChars = restoredChars.map((c: any) => ({
          ...c,
          adveId: newAdventure.id,
        }));
        await tx.insert(characters).values(mappedChars);
      }

      if (log && log.length > 0) {
        const mappedLogs = log.map((entry: any) => ({
          ...entry,
          id: undefined,
          adveId: newAdventure.id,
        }));
        await tx.insert(adventureLogs).values(mappedLogs);
      }

      if (chat && chat.length > 0) {
        const mappedChats = chat.map((entry: any) => ({
          ...entry,
          id: undefined,
          adveId: newAdventure.id,
        }));
        await tx.insert(chatMessages).values(mappedChats);
      }
    });

    return NextResponse.json({success: true, roomId}, {status: 201});
  }
  catch (error) {
    console.error('Erro ao criar sala:', error);
    return NextResponse.json({error: 'Erro no servidor.'}, {status: 500});
  }
}