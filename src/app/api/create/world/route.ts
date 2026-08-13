// arquivo: salva o mundo-template no banco de dados
// local: src\app\api\create\world\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {worldTemplates} from '@/db/schema';

const ADMIN_KEY = process.env.ADMIN_KEY;

function isAuthorized(request: Request): boolean {
  const providedKey = request.headers.get('x-admin-key');
  return Boolean(ADMIN_KEY) && providedKey === ADMIN_KEY;
}

function buildValues(body: any) {
  const {title, version, theme, rules, places, history, npcs, monsters, items, groups, plots} = body;
  return {
    title,
    version,
    theme: theme ?? null,
    rules: JSON.stringify(rules),
    places: places ? JSON.stringify(places) : null,
    history: history ? JSON.stringify(history) : null,
    npcs: npcs ? JSON.stringify(npcs) : null,
    monsters: monsters ? JSON.stringify(monsters) : null,
    items: items ? JSON.stringify(items) : null,
    groups: groups ? JSON.stringify(groups) : null,
    plots: plots ? JSON.stringify(plots) : null,
  };
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  try {
    const body = await request.json();

    if (!body.title?.trim() || !body.version?.trim()) {
      return NextResponse.json({error: 'Título e versão são obrigatórios.'}, {status: 400});
    }
    if (!body.rules) {
      return NextResponse.json({error: 'Regras (rules) são obrigatórias.'}, {status: 400});
    }

    const [template] = await db.insert(worldTemplates).values(buildValues(body)).returning({id: worldTemplates.id});

    return NextResponse.json({success: true, worldId: template.id});
  }
  catch (error) {
    console.error('Erro ao cadastrar mundo-template:', error);
    return NextResponse.json({error: 'Erro interno no servidor.'}, {status: 500});
  }
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({error: 'Não autorizado.'}, {status: 401});
  }

  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({error: 'id é obrigatório para atualizar.'}, {status: 400});
    }

    const [existente] = await db.select().from(worldTemplates).where(eq(worldTemplates.id, body.id));
    if (!existente) {
      return NextResponse.json({error: 'Mundo-template não encontrado.'}, {status: 404});
    }

    await db.update(worldTemplates).set(buildValues(body)).where(eq(worldTemplates.id, body.id));

    return NextResponse.json({success: true, worldId: body.id});
  }
  catch (error) {
    console.error('Erro ao atualizar mundo-template:', error);
    return NextResponse.json({error: 'Erro interno no servidor.'}, {status: 500});
  }
}