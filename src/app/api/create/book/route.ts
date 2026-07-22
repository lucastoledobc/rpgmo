// arquivo: route para criação de mundo a partir do livro da pessoa
// local: src\app\api\create\book\route.ts

import {NextResponse} from 'next/server';
import {db} from '@/db';
import {worlds} from '@/db/schema';

export async function POST(request: Request) {
  try {
    const book = await request.json();

    if (!book?.title?.trim() || !book?.rules) {
      return NextResponse.json(
        {error: 'Livro inválido: faltam campos obrigatórios (title e rules).'},
        {status: 400}
      );
    }

    const [inserted] = await db.insert(worlds).values({
      title: book.title,
      version: book.version ?? '1.00',
      theme: book.theme ?? null,
      rules: JSON.stringify(book.rules),
      places: book.places ? JSON.stringify(book.places) : null,
      history: book.history ? JSON.stringify(book.history) : null,
      chars: book.chars ? JSON.stringify(book.chars) : null,
      monsters: book.monsters ? JSON.stringify(book.monsters) : null,
      items: book.items ? JSON.stringify(book.items) : null,
      groups: book.groups ? JSON.stringify(book.groups) : null,
      plots: book.plots ? JSON.stringify(book.plots) : null,
    }).returning({id: worlds.id});

    return NextResponse.json({success: true, worldId: inserted.id});
  }
  catch (error) {
    console.error('Erro ao converter livro em world:', error);
    return NextResponse.json({error: 'Erro ao processar o livro.'}, {status: 500});
  }
}