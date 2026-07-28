// arquivo: route do histórico e narração da aventura
// local: src\app\api\room\[id]\adventure\route.ts

import {NextResponse} from 'next/server';
import {eq, asc, and, inArray} from 'drizzle-orm';
import {db} from '@/db';
import {rooms, adventures, worlds, masters, adventureLogs} from '@/db/schema';
import {decrypt} from '@/lib/crypto';

import {ActionPayload, State} from '@/types/adventure';
import {Master} from '@/types/master';

import {classifyAction} from '@/lib/master/classifyAction';
import {handlingError} from '@/lib/master/handlingError';
import {buildHistory} from '@/lib/master/history';
import {callMaster} from '@/lib/master/prompts/index';

let loading: number;

// ---------- GET: histórico (filtrado por type) ----------

export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;
    const {searchParams} = new URL(request.url);
    const requestedType = searchParams.get('type') === 'oc' ? 'oc' : 'ic';
    const typesToInclude = requestedType === 'ic' ? ['ic', 'error'] : ['oc'];

    const [adventureRow] = await db.select().from(adventures).where(eq(adventures.roomId, roomId));
    if (!adventureRow) {
      return NextResponse.json({error: 'Aventura não encontrada.'}, {status: 404});
    }
    let state: State;
    state = adventureRow?.state ? JSON.parse(adventureRow.state) : null;

    const log = await db
      .select({
        charName: adventureLogs.charName,
        text: adventureLogs.text,
      })
      .from(adventureLogs)
      .where(and(eq(adventureLogs.adveId, adventureRow.id), inArray(adventureLogs.type, typesToInclude)))
      .orderBy(asc(adventureLogs.sentAt));

    return NextResponse.json({log, loading, state});
  }
  catch (error) {
    console.error('Erro ao buscar histórico da aventura:', error);
    return NextResponse.json({error: 'Erro ao buscar histórico.'}, {status: 500});
  }
}

// ---------- POST: nova ação (ic) ou pergunta de bastidor (oc) ----------

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    loading = 1
    // importações e verificadores
    const {id: roomId} = await params;
    const payload: ActionPayload = await request.json();
    if (!(payload?.action && payload?.playerName && (payload?.mode === 'ic' || payload?.mode === 'oc'))) {
      return NextResponse.json({error: 'Ação, nome do jogador ou modo inválido.'}, {status: 400});
    }
    const [roomRow] = await db.select().from(rooms).where(eq(rooms.id, roomId));
    if (!roomRow) {
      return NextResponse.json({error: 'Sala não encontrada.'}, {status: 404});
    }
    const [adventureRow] = await db.select().from(adventures).where(eq(adventures.roomId, roomId));
    if (!adventureRow) {
      return NextResponse.json({error: 'Aventura não encontrada.'}, {status: 404});
    }
    const [worldRow] = await db.select().from(worlds).where(eq(worlds.id, adventureRow.worldId));
    if (!worldRow) {
      return NextResponse.json({error: 'Sala sem Livro configurado.'}, {status: 400});
    }
    const [masterRow] = await db.select().from(masters).where(eq(masters.roomId, roomId));
    if (!masterRow) {
      return NextResponse.json({error: 'Sala sem Mestre (IA) configurado.'}, {status: 400});
    }
    // descriptografa a chave
    const master: Master = {...masterRow, apiKey: masterRow.apiKey ? decrypt(masterRow.apiKey) : null};

    // pega a última instrução
    let state: State;
    state = adventureRow?.state ? JSON.parse(adventureRow.state) : {id: true, category: "START", object: "", objectType: "none", dice: 0, interactionId: ''};
    console.log("\nstate: "+JSON.stringify(state)+"\n")
    
    // pega os últimos acontecimentos
    const icLog = await db
      .select({charName: adventureLogs.charName, text: adventureLogs.text})
      .from(adventureLogs)
      .where(and(eq(adventureLogs.adveId, adventureRow.id), eq(adventureLogs.type, 'ic')))
      .orderBy(asc(adventureLogs.sentAt));
    const history = buildHistory(icLog, 4000);

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
    loading = 2

    if (!state.id) {
      // analisa a mensagem e classifica
      const actionAnalyzed = await classifyAction(master, payload);
      handlingError(payload, actionAnalyzed);
      console.log("\actionAnalyzed: "+JSON.stringify(actionAnalyzed)+"\n")

      state = {
        id: true,
        category: actionAnalyzed.category,
        object: actionAnalyzed.object,
        objectType: actionAnalyzed.objectType,
        dice: '',
        instruction: null,
        interactionId: null,
      }
    }

    // chama o mestre
    payload.response = await callMaster({payload, state, master, worldRow, history});
    console.log("\nresponse: "+payload.response+"\n")
    
    if (payload.response) {
      // salva a mensagem do mestre
      await db.insert(adventureLogs).values({
        adveId: adventureRow.id,
        sender: master.model,
        charId: null,
        charName: payload.playerName,
        type: payload.mode,
        text: payload.response,
        sentAt: new Date(),
      });

      // atualiza o horario da sala e outros
      await db.update(rooms).set({lastActivityAt: new Date()}).where(eq(rooms.id, roomId));
      await db.update(adventures).set({state: JSON.stringify(state)}).where(eq(adventures.roomId, roomId));
    }

    loading = 0

    return NextResponse.json({success: true, state: state});
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