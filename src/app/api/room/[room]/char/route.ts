// arquivo: cria e edita personagens de uma sala
// local: src\app\api\room\[room]\char\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns, characters, characterStatus, characterItems} from '@/db/schema';
import type {CharStatus, CharItems} from '@/types/campaign';


async function replaceStatusAndItems(charId: number, status: CharStatus[], items: CharItems[]) {
  await db.delete(characterStatus).where(eq(characterStatus.charId, charId));
  await db.delete(characterItems).where(eq(characterItems.charId, charId));

  if (status.length) {
    await db.insert(characterStatus).values(status.map((s) => ({charId, ...s})));
  }
  if (items.length) {
    await db.insert(characterItems).values(items.map((i) => ({charId, ...i})));
  }
}

// Criação
export async function POST(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;
    const {name, age, race, role, history, appearance, status, items} = await request.json();

    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!campaign) {
      return NextResponse.json({error: 'Sala não encontrada.'}, {status: 404});
    }

    const [inserted] = await db.insert(characters).values({
      room,
      name: name?.trim() || null,
      age: age ?? null,
      race: race ?? null,
      role: role ?? null,
      history: history ?? null,
      appearance: appearance ?? null,
    }).returning({id: characters.id});

    await replaceStatusAndItems(inserted.id, status ?? [], items ?? []);

    return NextResponse.json({success: true, charId: inserted.id}, {status: 201});
  }
  catch (error) {
    console.error('Erro ao criar personagem:', error);
    return NextResponse.json({error: 'Erro ao criar personagem.'}, {status: 500});
  }
}

// Edição
export async function PUT(request: Request, {params}: {params: Promise<{room: string}>}) {
  try {
    const {room} = await params;
    const {id, name, age, race, role, history, appearance, status, items} = await request.json();

    if (!id) {
      return NextResponse.json({error: 'id é obrigatório para edição.'}, {status: 400});
    }

    const [existente] = await db.select().from(characters).where(eq(characters.id, id));
    if (!existente || existente.room !== room) {
      return NextResponse.json({error: 'Personagem não encontrado nesta sala.'}, {status: 404});
    }

    await db.update(characters)
      .set({
        name: name?.trim() || null,
        age: age ?? null,
        race: race ?? null,
        role: role ?? null,
        history: history ?? null,
        appearance: appearance ?? null,
      })
      .where(eq(characters.id, id));

    await replaceStatusAndItems(id, status ?? [], items ?? []);

    return NextResponse.json({success: true, charId: id});
  }
  catch (error) {
    console.error('Erro ao editar personagem:', error);
    return NextResponse.json({error: 'Erro ao editar personagem.'}, {status: 500});
  }
}