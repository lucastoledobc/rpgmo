// arquivo: route do login
// local: src\app\api\auth\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import {db} from '@/db';
import {rooms} from '@/db/schema';

export async function POST(request: Request) {
  try {
    // recebe do front
    const {room, pass} = await request.json();

    // verifica a sala na db
    const [roomRow] = await db.select().from(rooms).where(eq(rooms.id, room));
    if (!roomRow) {
      return NextResponse.json({error: 'Sala não encontrada.'}, {status: 404});
    }

    // verifica a senha
    const senhaValida = await bcrypt.compare(pass, roomRow.passHash);
    if (!senhaValida) {
      return NextResponse.json({error: 'Senha incorreta.'}, {status: 401});
    }

    return NextResponse.json({success: true});
  }
  catch (error) {
    return NextResponse.json({error: 'Erro ao autenticar.'}, {status: 500});
  }
}