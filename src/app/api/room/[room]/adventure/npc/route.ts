// arquivo: route de conversa com NPC dentro do modal
// local: src\app\api\room\[id]\adventure\npc\route.ts

import {NextResponse} from 'next/server';
import {eq, desc} from 'drizzle-orm';
import {db} from '@/db';
import {rooms, adventures, worlds, masters, adventureLogs} from '@/db/schema';
import {decrypt} from '@/lib/crypto';

import type {ActionPayload, State} from '@/types/master';
import type {Master} from '@/types/master';

import {buildHistory} from '@/lib/master/history';
import {narrate} from '@/lib/master/narrate';
import {deleteGeminiChat} from '@/lib/master/masterGemini';

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;
    const payload: ActionPayload = await request.json();
    if (!(payload?.action && payload?.playerName)) {
      return NextResponse.json({error: 'Ação ou nome do jogador inválido.'}, {status: 400});
    }

    // pega no db a aventura e verifica se o estado é CONVERSA
    const [adventureRow] = await db.select().from(adventures).where(eq(adventures.roomId, roomId));
    if (!adventureRow) return NextResponse.json({error: 'Aventura não encontrada.'}, {status: 404});
    const state: State = adventureRow.state ? JSON.parse(adventureRow.state) : null;
    if (!state || state.category !== 'CONVERSA') {
      return NextResponse.json({error: 'Não há conversa ativa nesta sala.'}, {status: 409});
    }

    // pega os dados do mestre
    const [masterRow] = await db.select().from(masters).where(eq(masters.roomId, roomId));
    if (!masterRow) return NextResponse.json({error: 'Sala sem Mestre (IA) configurado.'}, {status: 400});
    const master = {...masterRow, apiKey: masterRow.apiKey ? decrypt(masterRow.apiKey) : null};

    // insere a fala do jogador no adventure_logs
    await db.insert(adventureLogs).values({
      adveId: adventureRow.id,
      sender: payload.playerName,
      charId: payload.char?.id ?? null,
      charName: payload.char?.name ?? null,
      type: payload.mode,
      text: payload.action,
      sentAt: new Date(),
    });

    // pega o log das últimas falas
    const log = await db
      .select()
      .from(adventureLogs)
      .where(eq(adventureLogs.adveId, adventureRow.id))
      .orderBy(desc(adventureLogs.sentAt))
      .limit(100);

    // otimiza para o mestre
    const chatHistory = buildHistory(log, ['npc'], 2000, true);

    // chama o mestre
    const res = await narrate({type: 'chat', master, chatHistory, instruction: state?.instruction ?? undefined, interactionId: state?.interactionId ?? undefined});
    if (res.interactionId) {state.interactionId = res.interactionId;}
    
    // salva a mensagem do mestre
    await db.insert(adventureLogs).values({
      adveId: adventureRow.id,
      sender: master.model,
      charId: null,
      charName: state.object,
      type: payload.mode,
      text: res.text,
      sentAt: new Date(),
    });

    // atualiza o horario da sala e outros
    await db.update(rooms).set({lastActivityAt: new Date()}).where(eq(rooms.id, roomId));
    await db.update(adventures).set({state: JSON.stringify(state)}).where(eq(adventures.roomId, roomId));

    return NextResponse.json({success: true, text: res.text});
  }
  catch (error) {
    console.error('Erro no chat com NPC:', error);
    return NextResponse.json({error: 'Erro ao conversar com o NPC.'}, {status: 500});
  }
}

export async function DELETE(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;

    const [adventureRow] = await db.select().from(adventures).where(eq(adventures.roomId, roomId));
    if (!adventureRow) return NextResponse.json({error: 'Aventura não encontrada.'}, {status: 404});
    const state: State = adventureRow.state ? JSON.parse(adventureRow.state) : null;
    if (!state || state.category !== 'CONVERSA') {
      return NextResponse.json({error: 'Não há conversa ativa nesta sala.'}, {status: 409});
    }

    const [masterRow] = await db.select().from(masters).where(eq(masters.roomId, roomId));
    if (!masterRow) return NextResponse.json({error: 'Sala sem Mestre (IA) configurado.'}, {status: 400});
    const master: Master = {...masterRow, apiKey: masterRow.apiKey ? decrypt(masterRow.apiKey) : null};
    if (master.system == 'gemini' && state.interactionId) {
      deleteGeminiChat({master, previousInteractionId: state.interactionId})
    }
    state.id = false;
    state.interactionId = null

    await db.update(adventures).set({state: JSON.stringify(state)}).where(eq(adventures.roomId, roomId));

    return NextResponse.json({success: true});
  }
  catch (error) {
    console.error('Erro ao encerrar conversa:', error);
    return NextResponse.json({error: 'Erro ao encerrar conversa.'}, {status: 500});
  }
}