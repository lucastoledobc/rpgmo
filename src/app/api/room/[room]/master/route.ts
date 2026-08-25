// arquivo: route de edição do mestre da sala
// local: src\app\api\room\[id]\master\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {masters} from '@/db/schema';
import {encrypt} from '@/lib/crypto';
import { stringify } from 'node:querystring';

export async function PUT(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;
    const {system, model, apiKey, url, contextSize, temperature, repeatPenalty, numPredict, personality} = await request.json();

    if (system && !['gemini', 'groq', 'mistral', 'ollama', 'ollamaL'].includes(system)) {
      return NextResponse.json({error: 'Sistema de IA inválido.'}, {status: 400});
    }

    const [master] = await db.select().from(masters).where(eq(masters.room, room));
    if (!master) {
      return NextResponse.json({error: 'Mestre não encontrado para esta sala.'}, {status: 404});
    }

    if (system !== 'ollamaL' && !master.apiKey && !apiKey) {
      return NextResponse.json({error: 'Configure uma chave de API antes de salvar.'}, {status: 400});
    }

    await db.update(masters)
      .set({
        system: system?.trim() ?? master.system,
        model: model?.trim() ?? master.model,
        apiKey: apiKey ? encrypt(apiKey) : master.apiKey,
        url: url?.trim() ?? master.url,
        personality: personality?.trim() ?? master.personality,
        contextSize: contextSize ?? master.contextSize,
        numPredict: numPredict ?? master.numPredict,
        repeatPenalty: repeatPenalty ?? master.repeatPenalty,
        temperature: temperature ?? master.temperature,
      })
      .where(eq(masters.room, room));

    return NextResponse.json({success: true});
  }
  catch (error) {
    console.error('Erro ao editar mestre:', error);
    return NextResponse.json({error: 'Erro ao editar mestre.'}, {status: 500});
  }
}