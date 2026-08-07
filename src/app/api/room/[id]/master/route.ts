// arquivo: route de edição do mestre da sala
// local: src\app\api\room\[id]\master\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {masters} from '@/db/schema';
import {encrypt} from '@/lib/crypto';

export async function PUT(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;
    const {system, model, modelImg, apiKey, url, contextSize, temperature, repeatPenalty, numPredict, personality, pass} = await request.json();

    if (system && !['gemini', 'ollamaLocal', 'ollamaOnline'].includes(system)) {
      return NextResponse.json({error: 'Sistema de IA inválido.'}, {status: 400});
    }

    const [master] = await db.select().from(masters).where(eq(masters.roomId, roomId));
    if (!master) {
      return NextResponse.json({error: 'Mestre não encontrado para esta sala.'}, {status: 404});
    }

    if (system !== 'ollamaLocal' && !master.apiKey && !pass) {
      return NextResponse.json({error: 'Configure uma chave de API antes de salvar.'}, {status: 400});
    }
    const encryptKey = pass ? encrypt(pass) : master.apiKey;

    await db.update(masters)
      .set({
        system: system?.trim() ?? master.system,
        model: model?.trim() ?? master.model,
        modelImg: modelImg?.trim() ?? master.modelImg,
        apiKey: encryptKey,
        url: url?.trim() ?? master.url,
        contextSize: contextSize ?? master.contextSize,
        numPredict: numPredict ?? master.numPredict,
        repeatPenalty: repeatPenalty ?? master.repeatPenalty,
        temperature: temperature ?? master.temperature,
        personality: personality?.trim() ?? master.personality,
      })
      .where(eq(masters.roomId, roomId));

    return NextResponse.json({success: true});
  }
  catch (error) {
    console.error('Erro ao editar mestre:', error);
    return NextResponse.json({error: 'Erro ao editar mestre.'}, {status: 500});
  }
}