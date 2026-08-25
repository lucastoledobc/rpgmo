// arquivo: route do histórico e narração da aventura
// local: src\app\api\room\[room]\adventure\route.ts

import {NextResponse} from 'next/server';
import {eq, asc, and, desc, inArray} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, worlds, masters, characters, campaignLogs} from '@/db/schema';
import {decrypt} from '@/lib/crypto';
import {getCampaign} from '@/lib/getCampaign'
import {pusherServer} from '@/lib/pusherServer';

import type {ActionPayload, ChatMessage} from '@/types/master';
import type {Status, Master, Character, Campaign, Log} from '@/types/campaign';

import {classifyAction} from '@/lib/master/classifyAction';
import {handlingError} from '@/lib/master/handlingError';
import {callMaster} from '@/lib/master/prompts/index';


// ---------- GET: histórico (filtrado por type) ----------

export async function GET(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;
    const {searchParams} = new URL(request.url);
    const requestedType = searchParams.get('type') === 'oc' ? 'oc' : 'ic';
    const typesToInclude = requestedType === 'ic' ? ['ic', 'error'] : ['oc'];

    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!campaign) {
      throw new Error('Campanha não encontrada.');
    }
    let status: Status;
    status = campaign?.status ? JSON.parse(campaign.status) : null;

    const log = await db
      .select({
        charName: campaignLogs.charName,
        text: campaignLogs.text,
      })
      .from(campaignLogs)
      .where(and(eq(campaignLogs.room, campaign.room), inArray(campaignLogs.type, typesToInclude)))
      .orderBy(asc(campaignLogs.sentAt));

    return NextResponse.json({log, status});
  }
  catch (error) {
    console.error('\nErro ao buscar histórico da aventura:\n', error);
    return NextResponse.json({error: 'Erro no servidor.'}, {status: 500});
  }
}

// ---------- POST: nova ação (ic) ou pergunta de bastidor (oc) ----------

export async function POST(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    // importações e verificadores
    const {room} = await params;
    let payload: ActionPayload = await request.json();

    // pega campanha do db
    const campaign = await getCampaign(room);
    if (!campaign) {
      return NextResponse.json({error: 'Campanha não encontrada.'}, {status: 404});
    }
    const [masterRow] = await db.select().from(masters).where(eq(masters.room, room));
    if (!campaign.world) {
      return NextResponse.json({error: 'Sala sem Livro configurado.'}, {status: 400});
    }
    if (!campaign.master) {
      return NextResponse.json({error: 'Sala sem Mestre (IA) configurado.'}, {status: 400});
    }
    // descriptografa a apiKey
    campaign.master = {...masterRow, apiKey: masterRow.apiKey ? decrypt(masterRow.apiKey) : null};
    
    // pega o estado e contexto atual do jogo
    if (!campaign.status) {
      campaign.status = {id: true, category: "START", dice: ''}
    }
    else if (payload.dice) {
      const [logRow] = await db.select().from(campaignLogs)
      .where(and(eq(campaignLogs.room, room), eq(campaignLogs.type, 'ic')))
      .orderBy(desc(campaignLogs.sentAt)).limit(1);
      const selectedChar = campaign.chars?.find((char) => char.id === logRow.charId) ?? null;
      payload = {
        action: logRow.text, 
        playerName: logRow.sender, 
        char: selectedChar ?? ({} as Character),
        dice: payload.dice,
        response: '',
        type: 'ic'
      }
    }
    else {
      const actionAnalyzed = await classifyAction(campaign.master, payload);
      console.log("\nactionAnalyzed: "+JSON.stringify(actionAnalyzed)+"\n")
      handlingError(payload, actionAnalyzed);
      console.log("\nactionAnalyzed: "+JSON.stringify(actionAnalyzed)+"\n")

      campaign.status = {
        id: true,
        category: actionAnalyzed.category,
        object: actionAnalyzed.object,
        objectType: actionAnalyzed.objectType,
        dice: '',
        instruction: '',
        interactionId: '',
      }
    }

    console.log("\npayload: "+JSON.stringify(payload)+"\n")
    console.log("\nstatus: "+JSON.stringify(campaign.status)+"\n")

    // chama o mestre
    payload.response = await callMaster({payload, campaign});
    console.log("\nresponse: "+payload.response+"\n")


    // atualiza o bd
    if (payload.type !== 'error') {
      await db.update(campaigns).set({status: JSON.stringify(campaign.status), lastActivityAt: new Date()}).where(eq(campaigns.room, room));
    }

    // insere a fala do jogador no adventure_logs
    await db.insert(campaignLogs).values({
      room,
      sender: payload.playerName,
      charId: payload.char?.id ?? null,
      charName:  payload.char?.name ?? null,
      type: payload.type === 'error' ? 'error' : 'ic',
      text: typeof(campaign.status.dice) === 'string' ? payload?.action : String(campaign.status.dice),
      sentAt: new Date(),
    });

    // insere a fala do mestre no adventure_logs
    await db.insert(campaignLogs).values({
      room,
      sender: campaign.master.model ?? 'Master',
      charId: null,
      charName: 'Mestre',
      type: payload.type ?? '',
      text: payload.response,
      sentAt: new Date(),
    })

    try {
      await pusherServer.trigger(`room-${room}`, 'update', {
        newMessage: payload.response,
        sender: campaign.master.model ?? 'Master'
      });
    }
    catch (error) {
      console.error('Erro ao notificar via Pusher:', error);
    }

    return NextResponse.json({success: true, status: campaign.status});
  }
  catch (error) {
    console.error("\nErro no backend da Aventura:\n", error);
    return NextResponse.json({error: 'Erro ao invocar o Mestre.'}, {status: 500});
  }
}