// arquivo: route do chat entre jogadores
// local: src\app\api\room\[id]\chat\route.ts

import {NextResponse} from 'next/server';
import {eq, asc} from 'drizzle-orm';
import {db} from '@/db';
import {rooms, adventures, chatMessages} from '@/db/schema';

// GET: histórico do chat
export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;

    const [adventureRow] = await db.select().from(adventures).where(eq(adventures.roomId, roomId));
    if (!adventureRow) {
      return NextResponse.json({error: 'Aventura não encontrada.'}, {status: 404});
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.adveId, adventureRow.id))
      .orderBy(asc(chatMessages.sentAt));

    return NextResponse.json({messages});
  }
  catch (error) {
    console.error('Erro ao buscar chat:', error);
    return NextResponse.json({error: 'Erro ao buscar chat.'}, {status: 500});
  }
}

// POST: nova mensagem
export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;
    const {sender, text} = await request.json();

    if (!sender?.trim() || !text?.trim()) {
      return NextResponse.json({error: 'Remetente e mensagem são obrigatórios.'}, {status: 400});
    }

    const [adventureRow] = await db.select().from(adventures).where(eq(adventures.roomId, roomId));
    if (!adventureRow) {
      return NextResponse.json({error: 'Aventura não encontrada.'}, {status: 404});
    }

    await db.insert(chatMessages).values({
      adveId: adventureRow.id,
      sender: sender.trim(),
      text: text.trim(),
      sentAt: new Date(),
    });

    await db.update(rooms).set({lastActivityAt: new Date()}).where(eq(rooms.id, roomId));

    return NextResponse.json({success: true});
  }
  catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json({error: 'Erro ao enviar mensagem.'}, {status: 500});
  }
}