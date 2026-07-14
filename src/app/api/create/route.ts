// arquivo: route da criação da sala
// local: src\app\api\create\route.ts

import {NextResponse} from 'next/server';
import {eq, and} from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import {db} from '@/db';
import {rooms, worlds, masters, adventures, characters, adventureLogs, chatMessages} from '@/db/schema';
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

    // gera o id da sala e garante que não existe duplicata
    let roomId = '';
    let sId = false;
    while (!sId) {
      roomId = Array.from({length: 12}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join('');
      const [exist] = await db.select().from(rooms).where(eq(rooms.id, roomId));
      if (!exist) sId = true;
    }

    // resolve o mundo: custom usa o worldId já criado por /api/create/book;
    // caso contrário, busca o mundo pronto correspondente ao slug do select.
    if (worldTitle !== 'custom') {
      const [world] = await db.select().from(worlds).where(
        and(
          eq(worlds.title, worldTitle), 
          eq(worlds.version, worldVersion)
        ));

      if (!world) {
        return NextResponse.json({error: `Mundo (${worldTitle}) versão(${worldVersion}) não encontrado.`}, {status: 404});
      }
      worldId = world.id;
    }

    const passHash = await bcrypt.hash(pass, 10);
    const keyHash = masterKey ? await bcrypt.hash(masterKey, 10) : null;

    await db.transaction(async (tx) => {
      
      await tx.insert(rooms).values({
        id: roomId,
        passHash,
        createdAt: new Date(),
        lastActivityAt: new Date(),
      });

      await tx.insert(adventures).values({
        roomId,
        title,
        worldId,
        timeline,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      });

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

      // RESTAURAR DADOS ANTIGOS (Upload JSON)      
      if (chars && chars.length > 0) {
        const mappedChars = chars.map((c: any) => ({
          ...c,
          id: undefined, 
          roomId: roomId,
        }));
        await tx.insert(characters).values(mappedChars);
      }

      if (log && log.length > 0) {
        const mappedLogs = log.map((log: any) => ({
          ...log,
          id: undefined,
          roomId: roomId,
        }));
        await tx.insert(adventureLogs).values(mappedLogs);
      }

      if (chat && chat.length > 0) {
        const mappedChats = chat.map((chat: any) => ({
          ...chat,
          id: undefined,
          roomId: roomId,
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