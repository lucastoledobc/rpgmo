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
    const {system, model, personality, apiKey, contextSize, temperature, repeatPenalty, numPredict} = await request.json();

    if (!model?.trim()) {
      return NextResponse.json({error: 'O modelo é obrigatório.'}, {status: 400});
    }

    if (system && !['ollama', 'gemini'].includes(system)) {
      return NextResponse.json({error: 'Sistema de IA inválido.'}, {status: 400});
    }

    const [existente] = await db.select().from(masters).where(eq(masters.roomId, roomId));
    if (!existente) {
      return NextResponse.json({error: 'Mestre não encontrado para esta sala.'}, {status: 404});
    }

    if (system === 'gemini' && !existente.apiKey && !apiKey) {
      return NextResponse.json({error: 'Configure uma chave de API do Gemini antes de salvar.'}, {status: 400});
    }

    await db.update(masters)
      .set({
        system: system ?? existente.system,
        model: model.trim(),
        personality: personality || null,
        temperature: temperature ?? null,
        // Ollama-específicos: se o sistema não for ollama, zera (não fazem sentido pro Gemini)
        contextSize: system === 'ollama' ? (contextSize ?? null) : null,
        repeatPenalty: system === 'ollama' ? (repeatPenalty ?? null) : null,
        numPredict: system === 'ollama' ? (numPredict ?? null) : null,
        // só reescreve a chave se veio algo novo — string vazia/undefined preserva a atual
        ...(apiKey ? {apiKey: encrypt(apiKey)} : {}),
      })
      .where(eq(masters.roomId, roomId));

    return NextResponse.json({success: true});
  }
  catch (error) {
    console.error('Erro ao editar mestre:', error);
    return NextResponse.json({error: 'Erro ao editar mestre.'}, {status: 500});
  }
}