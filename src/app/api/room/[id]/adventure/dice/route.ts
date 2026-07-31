// arquivo: recebe o valor dos dados lançados e chama o mestre
// local: src\app\api\room\[id]\adventure\dice\route.ts

import {NextResponse} from 'next/server';
import {eq, desc, and} from 'drizzle-orm';
import {db} from '@/db';
import {adventures, characters, adventureLogs} from '@/db/schema';
import type {State} from '@/types/adventure';

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;
    const {diceValue} = await request.json();

    // pega a aventura, chars e log da aventura
    const [adventureRow] = await db.select().from(adventures).where(eq(adventures.roomId, roomId));
    if (!adventureRow) {
      return NextResponse.json({error: 'Aventura não encontrada.'}, {status: 404});
    }    
    const characterRows = await db.select().from(characters).where(eq(characters.adveId, adventureRow.id));
    if (!characterRows) {
      return NextResponse.json({error: 'Personagem não encontrado.'}, {status: 404});
    }
    const [logRow] = await db.select().from(adventureLogs).where(and(eq(adventureLogs.adveId, adventureRow.id),eq(adventureLogs.type, 'ic'))).orderBy(desc(adventureLogs.id)).limit(1);
    if (!logRow) {
      return NextResponse.json({error: 'Log da Aventura não encontrado.'}, {status: 404});
    }

    // registra o valor do dado
    let state: State = adventureRow.state ? JSON.parse(adventureRow.state) : {};
    state.dice = diceValue;
    // e salva no db
    await db.update(adventures)
      .set({state: JSON.stringify(state)})
      .where(eq(adventures.roomId, roomId));

    // pega o char em específico e refaz a ação (mas agora tem o valor do dado)
    const selectedChar = characterRows.find((c) => c.id === logRow.charId) ?? null;

    const origin = new URL(request.url).origin;
    fetch(`${origin}/api/room/${roomId}/adventure`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: logRow.text, playerName: logRow.sender, char: selectedChar, mode: 'ic'}),
    });

    return NextResponse.json({success: true, state});
  }
  catch (error) {
    console.error('Erro na rota de dados:', error);
    return NextResponse.json({error: 'Erro ao atualizar resultado do dado.'}, {status: 500});
  }
}
