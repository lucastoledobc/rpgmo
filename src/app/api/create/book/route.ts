// arquivo: route para criação de mundo a partir do livro da pessoa
// local: src\app\api\create\book\route.ts

import {NextResponse} from 'next/server';
import {db} from '@/db';
import {worlds} from '@/db/schema';

export async function POST(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;
    const book = await request.json();

    await db.insert(worlds).values({
      room,
      title: book.title ?? 'Livro sem título',
      version: book.version ?? '1.00',
      theme: book.theme ?? null,
      rules: book.rules ? JSON.stringify(book.rules) : 'Regra básica: tudo se resolve com d20.',
      places: book.places ? JSON.stringify(book.places) : null,
      history: book.history ? JSON.stringify(book.history) : null,
      npcs: book.npcs ? JSON.stringify(book.npcs) : null,
      monsters: book.monsters ? JSON.stringify(book.monsters) : null,
      items: book.items ? JSON.stringify(book.items) : null,
      groups: book.groups ? JSON.stringify(book.groups) : null,
      plots: book.plots ? JSON.stringify(book.plots) : null,
    });

    return NextResponse.json({success: true});
  }
  catch (error) {
    console.error('Erro ao converter livro em world:', error);
    return NextResponse.json({error: 'Erro ao processar o livro.'}, {status: 500});
  }
}