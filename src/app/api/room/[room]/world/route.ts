// arquivo: configura/atualiza o mundo de uma sala já existente
// local: src\app\api\room\[room]\world\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, worldTemplates, worlds} from '@/db/schema';

export async function PUT(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;
    const {templateId, world} = await request.json();

    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!campaign) {
      return NextResponse.json({error: 'Sala não encontrada.'}, {status: 404});
    }

    let values: typeof worlds.$inferInsert;

    if (templateId) {
      const [template] = await db.select().from(worldTemplates).where(eq(worldTemplates.id, Number(templateId)));

      if (!template) {
        return NextResponse.json({error: 'Mundo pré-pronto não encontrado.'}, {status: 404});
      }

      const {id: _templateId, ...templateFields} = template;
      values = {room, ...templateFields};
    }
    else if (world) {
      values = {
        room,
        title: world.title ?? 'Mundo sem título',
        version: world.version ?? '1.00',
        theme: world.theme ?? null,
        rules: JSON.stringify(world.rules) ?? 'Regra básica: tudo se resolve com d20.',
        places: world.places ? JSON.stringify(world.places) : null,
        history: world.history ? JSON.stringify(world.history) : null,
        npcs: world.npcs ? JSON.stringify(world.npcs) : null,
        monsters: world.monsters ? JSON.stringify(world.monsters) : null,
        items: world.items ? JSON.stringify(world.items) : null,
        groups: world.groups ? JSON.stringify(world.groups) : null,
        plots: world.plots ? JSON.stringify(world.plots) : null,
      };
    }
    else {
      return NextResponse.json({error: 'Escolha um livro pelo select ou suba seu livro.'}, {status: 400});
    }

    // upsert: cria se a sala ainda não tem mundo, substitui se já tinha
    await db.insert(worlds)
      .values(values)
      .onConflictDoUpdate({target: worlds.room, set: values});

    return NextResponse.json({success: true});
  }
  catch (error) {
    console.error('Erro ao configurar mundo:', error);
    return NextResponse.json({error: 'Erro interno no servidor.'}, {status: 500});
  }
}