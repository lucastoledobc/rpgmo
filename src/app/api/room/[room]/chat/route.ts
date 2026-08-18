// arquivo: route do chat entre jogadores
// local: src\app\api\room\[id]\chat\route.ts

import {NextResponse} from 'next/server';
import {eq, asc} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, chatMessages} from '@/db/schema';

// GET: histórico do chat
export async function GET(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;

    const [campaignRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!campaignRow) {
      return NextResponse.json({error: 'Campanha não encontrada.'}, {status: 404});
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.room, room))
      .orderBy(asc(chatMessages.sentAt));

    return NextResponse.json({messages});
  }
  catch (error) {
    console.error('Erro ao buscar chat:', error);
    return NextResponse.json({error: 'Erro ao buscar chat.'}, {status: 500});
  }
}

// POST: nova mensagem
export async function POST(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;
    const {sender, text} = await request.json();

    if (!sender?.trim() || !text?.trim()) {
      return NextResponse.json({error: 'Remetente e mensagem são obrigatórios.'}, {status: 400});
    }

    const [campaignRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!campaignRow) {
      return NextResponse.json({error: 'Campanha não encontrada.'}, {status: 404});
    }

    await db.insert(chatMessages).values({
      room,
      sender: sender.trim(),
      text: text.trim(),
      sentAt: new Date(),
    });

    await db.update(campaigns).set({lastActivityAt: new Date()}).where(eq(campaigns.room, room));

    return NextResponse.json({success: true});
  }
  catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json({error: 'Erro ao enviar mensagem.'}, {status: 500});
  }
}