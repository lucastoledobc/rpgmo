// arquivo: criação de mundo
// local: src\app\api\create\world\route.ts

import {NextResponse} from 'next/server';
import {db} from '@/db';
import {worlds} from '@/db/schema';

export async function POST(request: Request) {
  try {
    const {
      title, 
      version, 
      theme,
      rules,
      places,
      history,
      chars,
      monsters,
      items,
      groups,
      plots,
    } = await request.json();

    if (!title?.trim() || !version?.trim()) {
      return NextResponse.json({error: 'Título e versão são obrigatórios.'}, {status: 400});
    }

    // Insere o novo mundo
    const [newWorld] = await db.insert(worlds).values({
      title, 
      version, 
      theme,
      rules: JSON.stringify(rules),
      places: JSON.stringify(places),
      history: JSON.stringify(history),
      chars: JSON.stringify(chars),
      monsters: JSON.stringify(monsters),
      items: JSON.stringify(items),
      groups: JSON.stringify(groups),
      plots: JSON.stringify(plots),
    }).returning({id: worlds.id});

    return NextResponse.json({success: true, worldId: newWorld.id});
  } 
  catch (error) {
    console.error('Erro ao cadastrar mundo:', error);
    return NextResponse.json({error: 'Erro interno no servidor.'}, {status: 500});
  }
}