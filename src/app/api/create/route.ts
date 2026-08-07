// arquivo: route da criação da sala
// local: src\app\api\create\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {rooms, adventures, worlds, masters, characters, characterStatus, characterItems, adventureLogs, chatMessages} from '@/db/schema';
import {generateCharId} from '@/lib/generateCharId';
import bcrypt from 'bcryptjs';
import {encrypt} from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    // recebe do front
    let {room, adventure, world, master, chars, charStatus, charItems, log, chat} = await request.json();

    // verifica se nome da sala e senha foram preenchidos
    if (!adventure?.title?.trim() || !room?.pass?.trim()) {
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

    // mundo
    let sourceWorld: any;
    if (adventure.worldId === 0 && !world) {
      return NextResponse.json({error: 'Mundo personalizado não fornecido.'}, {status: 400});
    }
    else if (adventure.worldId !== 0) {
      // aventura nova -> pega o livro no db
      [sourceWorld] = await db.select().from(worlds).where(eq(worlds.id, adventure.worldId));
      if (!sourceWorld) {
        return NextResponse.json({error: 'Mundo de origem não encontrado.'}, {status: 404});
      }

      // seleciona um plot aleatório do livro, caso haja
      const plotsArray = sourceWorld.plots ? JSON.parse(sourceWorld.plots) : [];
      if (plotsArray.length > 0) {
        adventure.context.plot = Math.floor(Math.random() * plotsArray.length);
      }
    }
    else {
      // aventura antiga -> pega o mundo do json recebido
      sourceWorld = {
        title: world.title ?? 'Mundo Personalizado',
        version: world.version ?? '1.00',
        theme: world.theme,
        rules: world.rules ? JSON.stringify(world.rules) : 'rpg simples, qualquer problema se resolve com d20',
        places: world.places ? JSON.stringify(world.places) : null,
        history: world.history ? JSON.stringify(world.history) : null,
        chars: world.chars ? JSON.stringify(world.chars) : null,
        monsters: world.monsters ? JSON.stringify(world.monsters) : null,
        items: world.items ? JSON.stringify(world.items) : null,
        groups: world.groups ? JSON.stringify(world.groups) : null,
        plots: world.plots ? JSON.stringify(world.plots) : null,
      };
    }

    // criptografa a senha da sala e apiKey do mestre
    const passHash = await bcrypt.hash(room.pass, 10);
    const encryptedKey = master.apiKey ? encrypt(master.apiKey) : null;

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
      const [worldCopy] = await tx.insert(worlds).values({...worldFields}).returning({id: worlds.id});

      // aventura
      const [newAdventure] = await tx.insert(adventures).values({
        roomId,
        title: adventure.title,
        worldId: worldCopy.id,
        state: adventure.state,
        context: adventure.context,
        timeline: adventure.timeline,
        createdAt: adventure.createdAt ? new Date(adventure.createdAt) : new Date(),
      }).returning({id: adventures.id});

      // mestre (IA)
      await tx.insert(masters).values({
        roomId,
        system: master.system,
        model: master.model,
        apiKey: encryptedKey,
        url: master.system === 'ollamaLocal' ? master.apiKey : 'http://127.0.0.1:11434',
        contextSize: 4096,
        numPredict: 400,
        temperature: 0.85,
        repeatPenalty: 1.3,
        personality: master.personality || 'Mestre clássico de RPG, descritivo e justo.',
      });

      // restaura os personagens de uma aventura antiga e gera ids únicos para cada um
      const idMap = new Map<string, string>();

      const restoredChars = chars && chars.length > 0
        ? await Promise.all(chars.map(async (c: any) => {
            const newId = await generateCharId();
            idMap.set(c.id, newId);
            return {...c, id: newId};
          }))
        : [];

      if (restoredChars.length > 0) {
        await tx.insert(characters).values(restoredChars.map((c: any) => ({...c, adveId: newAdventure.id})));
      }

      if (charStatus && charStatus.length > 0) {
        const mappedStatus = charStatus.map((s: any) => ({
          ...s,
          id: undefined,
          charId: idMap.get(s.charId) ?? s.charId,
        }));
        await tx.insert(characterStatus).values(mappedStatus);
      }

      if (charItems && charItems.length > 0) {
        const mappedItems = charItems.map((i: any) => ({
          ...i,
          id: undefined,
          charId: idMap.get(i.charId) ?? i.charId,
        }));
        await tx.insert(characterItems).values(mappedItems);
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