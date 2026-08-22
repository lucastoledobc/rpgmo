// arquivo: route do histórico e narração da aventura
// local: src\app\api\room\[id]\adventure\route.ts

import {NextResponse} from 'next/server';
import {eq, asc, and, desc, inArray} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, worlds, masters, characters, campaignLogs} from '@/db/schema';
import {decrypt} from '@/lib/crypto';
import {getCampaign} from '@/lib/getCampaign'

import type {ActionPayload, ChatMessage} from '@/types/master';
import type {Status, Master, Character, Campaign, Log} from '@/types/campaign';

import {classifyAction} from '@/lib/master/classifyAction';
import {handlingError} from '@/lib/master/handlingError';
import {callMaster} from '@/lib/master/prompts/index';

let loading: string;

// ---------- GET: histórico (filtrado por type) ----------

export async function GET(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;
    const {searchParams} = new URL(request.url);
    const requestedType = searchParams.get('type') === 'oc' ? 'oc' : 'ic';
    const typesToInclude = requestedType === 'ic' ? ['ic', 'error'] : ['oc'];

    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!campaign) {
      return NextResponse.json({error: 'Campanha não encontrada.'}, {status: 404});
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

    return NextResponse.json({log, loading, status});
  }
  catch (error) {
    console.error('Erro ao buscar histórico da aventura:', error);
    return NextResponse.json({error: 'Erro ao buscar histórico.'}, {status: 500});
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
    if (!campaign.world) {
      return NextResponse.json({error: 'Sala sem Livro configurado.'}, {status: 400});
    }
    if (!campaign.master) {
      return NextResponse.json({error: 'Sala sem Mestre (IA) configurado.'}, {status: 400});
    }
    // descriptografa a apiKey
    campaign.master = {...campaign.master, apiKey: campaign.master.apiKey ? decrypt(campaign.master.apiKey) : null};
    
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
      loading = 'O Mestre está pensando...'
      const actionAnalyzed = await classifyAction(campaign.master, payload);
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

    loading = 'O Mestre está digitando...'

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
      type: payload.type ?? '',
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

    loading = ''

    return NextResponse.json({success: true, status: campaign.status});
  }
  catch (error) {
    console.error("ERRO NO BACKEND DA AVENTURA:", error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";

    if (errorMsg.includes('fetch failed') || errorMsg.includes('ECONNREFUSED')) {
      return NextResponse.json({error: 'Erro de Conexão', details: 'O servidor do Ollama não está rodando. Abra o Ollama no seu PC.'}, {status: 500});
    }

    loading = ''

    return NextResponse.json({error: 'Erro ao invocar o Mestre', details: errorMsg}, {status: 500});
  }
}