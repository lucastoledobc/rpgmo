// arquivo: route do histórico e narração da aventura
// local: src\app\api\room\[id]\log\route.ts

import {NextResponse} from 'next/server';
import {eq, asc, and} from 'drizzle-orm';
import {db} from '@/db';
import {adventures, adventureLogs} from '@/db/schema';

export async function GET({params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;

    const [adventureRow] = await db.select().from(adventures).where(eq(adventures.roomId, roomId));
    if (!adventureRow) {
      return NextResponse.json({error: 'Aventura não encontrada.'}, {status: 404});
    }
    
    let log = await db
      .select()
      .from(adventureLogs)
      .where(and(eq(adventureLogs.adveId, adventureRow.id)))
      .orderBy(asc(adventureLogs.sentAt));

    return NextResponse.json({log});
  }
  catch (error) {
    console.error("Erro ao acessar o Log da Aventura:", error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";

    return NextResponse.json({error: 'Erro ao acessar o Log da Aventura.', details: errorMsg}, {status: 500});
  }
}