// arquivo: route de edição do mestre da sala
// local: src\app\api\room\[id]\master\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {masters} from '@/db/schema';

export async function PUT(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;
    const {model, personality, contextSize, temperature, repeatPenalty, numPredict} = await request.json();

    if (!model?.trim()) {
      return NextResponse.json({error: 'O modelo é obrigatório.'}, {status: 400});
    }

    const [existente] = await db.select().from(masters).where(eq(masters.roomId, roomId));
    if (!existente) {
      return NextResponse.json({error: 'Mestre não encontrado para esta sala.'}, {status: 404});
    }

    await db.update(masters)
      .set({
        model: model.trim(),
        personality: personality || null,
        contextSize: contextSize ?? null,
        temperature: temperature ?? null,
        repeatPenalty: repeatPenalty ?? null,
        numPredict: numPredict ?? null,
      })
      .where(eq(masters.roomId, roomId));

    return NextResponse.json({success: true});
  }
  catch (error) {
    console.error('Erro ao editar mestre:', error);
    return NextResponse.json({error: 'Erro ao editar mestre.'}, {status: 500});
  }
}