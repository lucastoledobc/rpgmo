// arquivo: route de criação/edição de personagem
// local: src\app\api\room\[id]\char\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {characters, characterStatus, characterItems} from '@/db/schema';
import {generateCharId} from '@/lib/generateCharId';

interface StatusInput {
  name: string;
  value: number;
  max: number | null;
  type: 'attribute' | 'resource';
}

interface ItemInput {
  name: string;
  slot: 'equip' | 'backpack';
  quantity: number;
}

async function replaceStatusAndItems(charId: string, status: StatusInput[], items: ItemInput[]) {
  await db.delete(characterStatus).where(eq(characterStatus.charId, charId));
  await db.delete(characterItems).where(eq(characterItems.charId, charId));

  if (status.length) {
    await db.insert(characterStatus).values(
      status.map((s) => ({charId, name: s.name, value: s.value, max: s.max, type: s.type}))
    );
  }

  if (items.length) {
    await db.insert(characterItems).values(
      items.map((i) => ({charId, name: i.name, slot: i.slot, quantity: i.quantity}))
    );
  }
}

// Criação 
export async function POST(request: Request) {
  try {
    const {adveId, name, age, race, class: charClass, history, status, items} = await request.json();

    if (!adveId) {
      return NextResponse.json({error: 'Id da Aventura nulo.'}, {status: 400});
    }

    const charId = await generateCharId();

    await db.insert(characters).values({
      id: charId,
      name: name?.trim() || null,
      adveId,
      age: age ?? null,
      race: race ?? null,
      class: charClass ?? null,
      history: history ?? null,
    });

    await replaceStatusAndItems(charId, status ?? [], items ?? []);

    return NextResponse.json({success: true, charId}, {status: 201});
  }
  catch (error) {
    console.error('Erro ao criar personagem:', error);
    return NextResponse.json({error: 'Erro ao criar personagem.'}, {status: 500});
  }
}

// Edição 
export async function PUT(request: Request) {
  try {
    const {charId, name, age, race, class: charClass, history, status, items} = await request.json();

    if (!charId) {
      return NextResponse.json({error: 'charId é obrigatório para edição.'}, {status: 400});
    }

    const [existente] = await db.select().from(characters).where(eq(characters.id, charId));
    if (!existente) {
      return NextResponse.json({error: 'Personagem não encontrado.'}, {status: 404});
    }

    await db.update(characters)
      .set({
        name: name?.trim() || null,
        age: age ?? null,
        race: race ?? null,
        class: charClass ?? null,
        history: history ?? null,
      })
      .where(eq(characters.id, charId));

    await replaceStatusAndItems(charId, status ?? [], items ?? []);

    return NextResponse.json({success: true, charId});
  }
  catch (error) {
    console.error('Erro ao editar personagem:', error);
    return NextResponse.json({error: 'Erro ao editar personagem.'}, {status: 500});
  }
}