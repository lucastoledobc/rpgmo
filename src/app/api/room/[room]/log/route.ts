// arquivo: route do histórico e narração da aventura
// local: src\app\api\room\[id]\log\route.ts

import {NextResponse} from 'next/server';
import {eq, asc, and} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, campaignLogs} from '@/db/schema';

export async function GET(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;

    const [campaignRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!campaignRow) {
      return NextResponse.json({error: 'Campanha não encontrada.'}, {status: 404});
    }
    
    let log = await db
      .select()
      .from(campaignLogs)
      .where(and(eq(campaignLogs.room, room)))
      .orderBy(asc(campaignLogs.sentAt));

    return NextResponse.json({log});
  }
  catch (error) {
    console.error("Erro ao acessar o Log da Campanha:", error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";

    return NextResponse.json({error: 'Erro ao acessar o Log da Campanha.', details: errorMsg}, {status: 500});
  }
}