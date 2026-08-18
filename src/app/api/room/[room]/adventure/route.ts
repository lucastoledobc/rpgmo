// arquivo: route do histórico e narração da aventura
// local: src\app\api\room\[id]\adventure\route.ts

import {NextResponse} from 'next/server';
import {eq, asc, and, desc, inArray} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, worlds, masters, campaignLogs} from '@/db/schema';
import {decrypt} from '@/lib/crypto';

import {ActionPayload} from '@/types/master';
import {Status, Master} from '@/types/campaign';

import {classifyAction} from '@/lib/master/classifyAction';
import {handlingError} from '@/lib/master/handlingError';
import {buildHistory} from '@/lib/master/history';
import {callMaster} from '@/lib/master/prompts/index';

let loading: number;

// ---------- GET: histórico (filtrado por type) ----------

export async function GET(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;
    const {searchParams} = new URL(request.url);
    const requestedType = searchParams.get('type') === 'oc' ? 'oc' : 'ic';
    const typesToInclude = requestedType === 'ic' ? ['ic', 'error'] : ['oc'];

    const [campaignRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!campaignRow) {
      return NextResponse.json({error: 'Campanha não encontrada.'}, {status: 404});
    }
    let status: Status;
    status = campaignRow?.status ? JSON.parse(campaignRow.status) : null;

    const log = await db
      .select({
        charName: campaignLogs.charName,
        text: campaignLogs.text,
      })
      .from(campaignLogs)
      .where(and(eq(campaignLogs.room, campaignRow.room), inArray(campaignLogs.type, typesToInclude)))
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
    loading = 1 // preparação
    // importações e verificadores
    const {room} = await params;
    const payload: ActionPayload = await request.json();
    if (!(payload?.action && payload?.playerName)) {
      return NextResponse.json({error: 'Ação ou nome do jogador inválido.'}, {status: 400});
    }

    // pega no db: campanha, mundo e mestre
    const [campaignRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!campaignRow) {
      return NextResponse.json({error: 'Campanha não encontrada.'}, {status: 404});
    }
    const [worldRow] = await db.select().from(worlds).where(eq(worlds.room, room));
    if (!worldRow) {
      return NextResponse.json({error: 'Sala sem Livro configurado.'}, {status: 400});
    }
    const [masterRow] = await db.select().from(masters).where(eq(masters.room, room));
    if (!masterRow) {
      return NextResponse.json({error: 'Sala sem Mestre (IA) configurado.'}, {status: 400});
    }
    // descriptografa a apiKey
    const master: Master = {...masterRow, apiKey: masterRow.apiKey ? decrypt(masterRow.apiKey) : null};
    
    // pega o estado e contexto atual do jogo
    let status: Status;
    status = campaignRow?.status ? JSON.parse(campaignRow.status) : {id: true, category: "START", object: "", objectType: "none", dice: 0, interactionId: ''};
    console.log("\nstatus: "+JSON.stringify(status)+"\n")


    // insere a fala do jogador no adventure_logs
    await db.insert(campaignLogs).values({
      room,
      sender: payload.playerName,
      charId: payload.char?.id ?? null,
      charName:  payload.char?.name ?? null,
      type: status.category === 'OUTRO' ? payload.mode : 'error',
      text: typeof(status.dice) === 'string' ? payload.action : String(status.dice),
      sentAt: new Date(),
    });
    // pega o log das últimas falas
    const logRow = await db
      .select()
      .from(campaignLogs)
      .where(eq(campaignLogs.room, room))
      .orderBy(desc(campaignLogs.sentAt));


    loading = 2 // mestre escutou, agora vai pensar

    if (!status.id) {
      // analisa a mensagem e classifica
      const actionAnalyzed = await classifyAction(master, payload);
      handlingError(payload, actionAnalyzed);
      console.log("\actionAnalyzed: "+JSON.stringify(actionAnalyzed)+"\n")

      status = {
        id: true,
        category: actionAnalyzed.category,
        object: actionAnalyzed.object,
        objectType: actionAnalyzed.objectType,
        dice: '',
        instruction: null,
        interactionId: null,
      }
    }

    loading = 3 // mestre pensou, agora vai digitar

    // chama o mestre
    payload.response = await callMaster({payload, status, master, worldRow, logRow});
    console.log("\nresponse: "+payload.response+"\n")
    
    if (payload.response) {
      // salva a mensagem do mestre
      await db.insert(campaignLogs).values({
        room,
        sender: master.model ?? 'Mestre',
        charId: null,
        charName: payload.playerName,
        type: payload.mode,
        text: payload.response,
        sentAt: new Date(),
      });

      // atualiza o horario da sala e outros
      await db.update(campaigns).set({lastActivityAt: new Date()}).where(eq(campaigns.room, room));
    }

    loading = 0

    return NextResponse.json({success: true, status: status});
  }
  catch (error) {
    console.error("ERRO NO BACKEND DA AVENTURA:", error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";

    if (errorMsg.includes('fetch failed') || errorMsg.includes('ECONNREFUSED')) {
      return NextResponse.json({error: 'Erro de Conexão', details: 'O servidor do Ollama não está rodando. Abra o Ollama no seu PC.'}, {status: 500});
    }

    loading = 0

    return NextResponse.json({error: 'Erro ao invocar o Mestre', details: errorMsg}, {status: 500});
  }
}