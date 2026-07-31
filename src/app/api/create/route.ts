// arquivo: route da criação da sala
// local: src\app\api\create\route.ts

import {NextResponse} from 'next/server';
import {eq, and} from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import {db} from '@/db';
import {rooms, worlds, masters, adventures, characters, adventureLogs, chatMessages} from '@/db/schema';
import {pickRandomPlot} from '@/lib/contextMaker';
import {generateCharId} from '@/lib/generateCharId';
import {encrypt} from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    // recebe do front
    let {
      title,
      pass,
      worldId,
      state,
      context,
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

    // verifica se nome da sala e senha foram preenchidos
    if (!title?.trim() || !pass?.trim()) {
      return NextResponse.json({error: 'Nome da sala e senha são obrigatórios.'}, {status: 400});
    }

    // gera um Id único para sala
    let roomId = '';
    let sId = false;
    while (!sId) {
      roomId = Array.from({length: 12}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join('');
      const [exist] = await db.select().from(rooms).where(eq(rooms.id, roomId));
      if (!exist) sId = true; // se não existe é preenchido, caso contrário, repete o loop
    }

    // pega o livro base do site caso 
    const [sourceWorld] = await db.select().from(worlds).where(eq(worlds.id, worldId));
    if (!sourceWorld) {
      return NextResponse.json({error: 'Mundo de origem não encontrado.'}, {status: 404});
    }

    // criptografa a senha da sala e apiKey do mestre
    const passHash = await bcrypt.hash(pass, 10);
    const keyHash = masterKey ? await encrypt(masterKey) : null;

    // preenche o banco de dados
    await db.transaction(async (tx) => {

      // sala
      await tx.insert(rooms).values({
        id: roomId,
        passHash,
        createdAt: new Date(),
        lastActivityAt: new Date(),
      });

      // mundo
      const {id: _templateId, ...worldFields} = sourceWorld;
      const [worldCopy] = await tx.insert(worlds).values({
        ...worldFields,
        plots: plot ? JSON.stringify([plot]) : pickRandomPlot(sourceWorld.plots),
      }).returning({id: worlds.id});

      // aventura
      const [newAdventure] = await tx.insert(adventures).values({
        roomId,
        title,
        worldId: worldCopy.id,
        state,
        context,
        timeline,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      }).returning({id: adventures.id});

      // mestre (IA)
      await tx.insert(masters).values({
        roomId,
        system: masterSystem,
        model: masterModel,
        apiKey: keyHash,
        contextSize: 4096,
        numPredict: 400,
        temperature: 0.85,
        repeatPenalty: 1.3,
        personality: personality || 'Mestre clássico de RPG, descritivo e justo.',
      });

      // restaura os personagens de uma aventura antiga e gera ids únicos para cada um
      const restoredChars = chars && chars.length > 0
        ? await Promise.all(chars.map(async (c: any) => ({...c, id: await generateCharId()})))
        : [];

      if (restoredChars.length > 0) {
        const mappedChars = restoredChars.map((c: any) => ({
          ...c,
          adveId: newAdventure.id,
        }));
        await tx.insert(characters).values(mappedChars);
      }

      // restaura o log
      if (log && log.length > 0) {
        const mappedLogs = log.map((entry: any) => ({
          ...entry,
          id: undefined,
          adveId: newAdventure.id,
        }));
        await tx.insert(adventureLogs).values(mappedLogs);
      }

      // restaura o chat
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
    return NextResponse.json({error: `Erro ao criar sala: ${error}`}, {status: 500});
  }
}