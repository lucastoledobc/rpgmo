// arquivo: recebe o valor dos dados lançados e chama o mestre
// local: src\app\api\room\[id]\adventure\dice\route.ts

import {NextResponse} from 'next/server';
import {eq, desc, and} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, characters, campaignLogs} from '@/db/schema';
import type {Status} from '@/types/campaign';

export async function POST(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;
    const {diceValue} = await request.json();

    // pega a aventura, chars e log da aventura
    const [campaignRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!campaignRow) {
      return NextResponse.json({error: 'Campanha não encontrada.'}, {status: 404});
    }    
    const characterRows = await db.select().from(characters).where(eq(characters.room, room));
    if (!characterRows) {
      return NextResponse.json({error: 'Personagem não encontrado.'}, {status: 404});
    }
    const [logRow] = await db.select().from(campaignLogs).where(and(eq(campaignLogs.room, room),eq(campaignLogs.type, 'ic'))).orderBy(desc(campaignLogs.id)).limit(1);
    if (!logRow) {
      return NextResponse.json({error: 'Log da Aventura não encontrado.'}, {status: 404});
    }

    // registra o valor do dado
    let status: Status = campaignRow.status ? JSON.parse(campaignRow.status) : {};
    status.dice = diceValue;
    // e salva no db
    await db.update(campaigns)
      .set({status: JSON.stringify(status)})
      .where(eq(campaigns.room, room));

    // pega o char em específico e refaz a ação (mas agora tem o valor do dado)
    const selectedChar = characterRows.find((c) => c.id === logRow.charId) ?? null;

    const origin = new URL(request.url).origin;
    fetch(`${origin}/api/room/${room}/adventure`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: logRow.text, playerName: logRow.sender, char: selectedChar, mode: 'ic'}),
    });

    return NextResponse.json({success: true, status});
  }
  catch (error) {
    console.error('Erro na rota de dados:', error);
    return NextResponse.json({error: 'Erro ao atualizar resultado do dado.'}, {status: 500});
  }
}
