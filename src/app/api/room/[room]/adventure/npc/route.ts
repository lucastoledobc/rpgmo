// arquivo: route de conversa com NPC dentro do modal
// local: src\app\api\room\[id]\adventure\npc\route.ts

import {NextResponse} from 'next/server';
import {eq, desc} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, worlds, masters, campaignLogs} from '@/db/schema';
import {decrypt} from '@/lib/crypto';

import type {ActionPayload} from '@/types/master';
import type {Status, Master} from '@/types/campaign';

import {buildHistory} from '@/lib/master/history';
import {narrate} from '@/lib/master/narrate';
import {deleteGeminiChat} from '@/lib/master/masterGemini';

export async function POST(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;
    const payload: ActionPayload = await request.json();
    if (!(payload?.action && payload?.playerName)) {
      return NextResponse.json({error: 'Ação ou nome do jogador inválido.'}, {status: 400});
    }

    // pega no db a aventura e verifica se o estado é CONVERSA
    const [campaignRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!campaignRow) return NextResponse.json({error: 'Campanha não encontrada.'}, {status: 404});
    const status: Status = campaignRow.status ? JSON.parse(campaignRow.status) : null;
    if (!status || status.category !== 'CONVERSA') {
      return NextResponse.json({error: 'Não há conversa ativa nesta sala.'}, {status: 409});
    }

    // pega os dados do mestre
    const [masterRow] = await db.select().from(masters).where(eq(masters.room, room));
    if (!masterRow) return NextResponse.json({error: 'Sala sem Mestre (IA) configurado.'}, {status: 400});
    const master = {...masterRow, apiKey: masterRow.apiKey ? decrypt(masterRow.apiKey) : null};

    // insere a fala do jogador no campaign_logs
    await db.insert(campaignLogs).values({
      room,
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
      .from(campaignLogs)
      .where(eq(campaignLogs.room, room))
      .orderBy(desc(campaignLogs.sentAt))
      .limit(100);

    // otimiza para o mestre
    const chatHistory = buildHistory(log, ['npc'], 2000, true);

    // chama o mestre
    const res = await narrate({type: 'chat', master, chatHistory, instruction: status?.instruction ?? undefined, interactionId: status?.interactionId ?? undefined});
    if (res.interactionId) {status.interactionId = res.interactionId;}
    
    // salva a mensagem do mestre
    await db.insert(campaignLogs).values({
      room,
      sender: master.model ?? 'Mestre',
      charId: null,
      charName: status.object,
      type: payload.mode,
      text: res.text,
      sentAt: new Date(),
    });

    // atualiza o horario da sala e outros
    await db.update(campaigns).set({lastActivityAt: new Date()}).where(eq(campaigns.room, room));
    await db.update(campaigns).set({status: JSON.stringify(status)}).where(eq(campaigns.room, room));

    return NextResponse.json({success: true, text: res.text});
  }
  catch (error) {
    console.error('Erro no chat com NPC:', error);
    return NextResponse.json({error: 'Erro ao conversar com o NPC.'}, {status: 500});
  }
}

export async function DELETE(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;

    const [campaignRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!campaignRow) return NextResponse.json({error: 'Campanha não encontrada.'}, {status: 404});
    const status: Status = campaignRow.status ? JSON.parse(campaignRow.status) : null;
    if (!status || status.category !== 'CONVERSA') {
      return NextResponse.json({error: 'Não há conversa ativa nesta sala.'}, {status: 409});
    }

    const [masterRow] = await db.select().from(masters).where(eq(masters.room, room));
    if (!masterRow) return NextResponse.json({error: 'Sala sem Mestre (IA) configurado.'}, {status: 400});
    const master: Master = {...masterRow, apiKey: masterRow.apiKey ? decrypt(masterRow.apiKey) : null};
    if (master.system == 'gemini' && status.interactionId) {
      deleteGeminiChat({master, previousInteractionId: status.interactionId})
    }
    status.id = false;
    status.interactionId = null

    await db.update(campaigns).set({status: JSON.stringify(status)}).where(eq(campaigns.room, room));

    return NextResponse.json({success: true});
  }
  catch (error) {
    console.error('Erro ao encerrar conversa:', error);
    return NextResponse.json({error: 'Erro ao encerrar conversa.'}, {status: 500});
  }
}