// arquivo: route do histórico e narração da aventura
// local: src\app\api\room\[id]\adventure\route.ts

import {NextResponse} from 'next/server';
import {eq, asc, and} from 'drizzle-orm';
import {db} from '@/db';
import {rooms, adventures, worlds, masters, adventureLogs} from '@/db/schema';
import {classifyAction} from '@/lib/master/classifyAction';
import {buildInstruction} from '@/lib/master/prompts';
import {narrateConsequence} from '@/lib/master/narrate';
import {answerOOC} from '@/lib/master/answerOOC';
import {buildHistoryByBudget} from '@/lib/master/history';

interface ActionPayload {
  playerName: string;
  char: {id: string; name: string | null} | null;
  action: string;
  mode: 'ic' | 'oc';
}

function validatePayload(payload: any): payload is ActionPayload {
  return Boolean(payload?.action && payload?.playerName && (payload?.mode === 'ic' || payload?.mode === 'oc'));
}

function parseWorldField<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  }
  catch {
    return fallback;
  }
}

// ---------- GET: histórico (filtrado por type) ----------

export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;
    const {searchParams} = new URL(request.url);
    const type = searchParams.get('type') === 'oc' ? 'oc' : 'ic';

    const [adventureRow] = await db.select().from(adventures).where(eq(adventures.roomId, roomId));
    if (!adventureRow) {
      return NextResponse.json({error: 'Aventura não encontrada.'}, {status: 404});
    }

    const log = await db
      .select({
        id: adventureLogs.id,
        sender: adventureLogs.sender,
        charId: adventureLogs.charId,
        charName: adventureLogs.charName,
        text: adventureLogs.text,
        sentAt: adventureLogs.sentAt,
      })
      .from(adventureLogs)
      .where(and(eq(adventureLogs.adveId, adventureRow.id), eq(adventureLogs.type, type)))
      .orderBy(asc(adventureLogs.sentAt));

    return NextResponse.json({log});
  }
  catch (error) {
    console.error('Erro ao buscar histórico da aventura:', error);
    return NextResponse.json({error: 'Erro ao buscar histórico.'}, {status: 500});
  }
}

// ---------- POST: nova ação (ic) ou pergunta de bastidor (oc) ----------

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;
    const payload = await request.json();

    if (!validatePayload(payload)) {
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
    const [masterRow] = await db.select().from(masters).where(eq(masters.roomId, roomId));

    if (!masterRow) {
      return NextResponse.json({error: 'Sala sem Mestre (IA) configurado.'}, {status: 400});
    }

    await db.insert(adventureLogs).values({
      adveId: adventureRow.id,
      sender: payload.playerName,
      charId: payload.char?.id ?? null,
      charName: payload.char?.name ?? null,
      type: payload.mode,
      text: payload.action,
      sentAt: new Date(),
    });

    const world = {
      rules: worldRow.rules,
      history: parseWorldField(worldRow.history, {}),
      places: parseWorldField(worldRow.places, []),
      chars: parseWorldField(worldRow.chars, []),
      monsters: parseWorldField(worldRow.monsters, []),
      items: parseWorldField(worldRow.items, []),
    };

    let aiResponseText: string;
    let charName = "Mestre";

    if (payload.mode === 'oc') {
        const icLog = await db
          .select({sender: adventureLogs.sender, charName: adventureLogs.charName, text: adventureLogs.text})
          .from(adventureLogs)
          .where(and(eq(adventureLogs.adveId, adventureRow.id), eq(adventureLogs.type, 'ic')))
          .orderBy(asc(adventureLogs.sentAt));

        const history = buildHistoryByBudget(icLog, 4000);

        aiResponseText = await answerOOC({
          master: masterRow,
          world,
          question: payload.action,
          history,
          charName: payload.char?.name ?? null,
          playerName: payload.playerName,
        });
      }
    else {
      const actionAnalyzed = await classifyAction(masterRow, payload.action);
      console.log(actionAnalyzed)

      // coloca o nome do npc para aparecer
      if (actionAnalyzed.object === 'CONVERSA') {
        charName = actionAnalyzed.object;
      }

      const instruction = buildInstruction(actionAnalyzed, world);
      console.log("Instrução final: "+instruction)

      const icLog = await db
        .select({sender: adventureLogs.sender, charName: adventureLogs.charName, text: adventureLogs.text})
        .from(adventureLogs)
        .where(and(eq(adventureLogs.adveId, adventureRow.id), eq(adventureLogs.type, 'ic')))
        .orderBy(asc(adventureLogs.sentAt));

      const lastMasterLine = [...icLog].reverse().find((l) => l.sender === masterRow.model)?.text ?? 'Nenhuma narração anterior.';

      aiResponseText = await narrateConsequence({
        master: masterRow,
        world,
        instruction,
        charName: payload.char?.name ?? null,
        playerName: payload.playerName,
        action: payload.action,
        lastMasterLine,
      });
    }

    await db.insert(adventureLogs).values({
      adveId: adventureRow.id,
      sender: masterRow.model,
      charId: null,
      charName,
      type: payload.mode,
      text: aiResponseText,
      sentAt: new Date(),
    });

    await db.update(rooms).set({lastActivityAt: new Date()}).where(eq(rooms.id, roomId));

    return NextResponse.json({success: true, masterResponse: aiResponseText});
  }
  catch (error) {
    console.error("ERRO NO BACKEND DA AVENTURA:", error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";

    if (errorMsg.includes('fetch failed') || errorMsg.includes('ECONNREFUSED')) {
      return NextResponse.json({error: 'Erro de Conexão', details: 'O servidor do Ollama não está rodando. Abra o Ollama no seu PC.'}, {status: 500});
    }

    return NextResponse.json({error: 'Erro ao invocar o Mestre', details: errorMsg}, {status: 500});
  }
}