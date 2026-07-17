// arquivo: criação de mundo
// local: src\app\api\create\world\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {worlds} from '@/db/schema';

function buildValues(body: any) {
  const {title, version, theme, rules, places, history, chars, monsters, items, groups, plots} = body;
  return {
    title,
    version,
    theme: theme ?? null,
    rules: JSON.stringify(rules),
    places: places ? JSON.stringify(places) : null,
    history: history ? JSON.stringify(history) : null,
    chars: chars ? JSON.stringify(chars) : null,
    monsters: monsters ? JSON.stringify(monsters) : null,
    items: items ? JSON.stringify(items) : null,
    groups: groups ? JSON.stringify(groups) : null,
    plots: plots ? JSON.stringify(plots) : null,
  };
}

// Cria um mundo novo (sempre uma linha nova — sem dedup por título/versão)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title?.trim() || !body.version?.trim()) {
      return NextResponse.json({error: 'Título e versão são obrigatórios.'}, {status: 400});
    }
    if (!body.rules) {
      return NextResponse.json({error: 'Regras (rules) são obrigatórias.'}, {status: 400});
    }

    const [world] = await db.insert(worlds).values(buildValues(body)).returning({id: worlds.id});

    return NextResponse.json({success: true, worldId: world.id});
  }
  catch (error) {
    console.error('Erro ao cadastrar mundo:', error);
    return NextResponse.json({error: 'Erro interno no servidor.'}, {status: 500});
  }
}

// Atualiza um mundo existente, identificado pelo id
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({error: 'id é obrigatório para atualizar.'}, {status: 400});
    }

    const [existente] = await db.select().from(worlds).where(eq(worlds.id, body.id));
    if (!existente) {
      return NextResponse.json({error: 'Mundo não encontrado.'}, {status: 404});
    }

    await db.update(worlds).set(buildValues(body)).where(eq(worlds.id, body.id));

    return NextResponse.json({success: true, worldId: body.id});
  }
  catch (error) {
    console.error('Erro ao atualizar mundo:', error);
    return NextResponse.json({error: 'Erro interno no servidor.'}, {status: 500});
  }
}