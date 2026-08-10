// arquivo: route do login
// local: src\app\api\auth\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns} from '@/db/schema';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    // recebe do front
    const {room, pass, playerName} = await request.json();

    // verifica a sala na db
    const [roomRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!roomRow) {
      return NextResponse.json({error: 'Sala não encontrada.'}, {status: 404});
    }

    // verifica a senha
    const senhaValida = await bcrypt.compare(pass, roomRow.passHash);
    if (!senhaValida) {
      return NextResponse.json({error: 'Senha incorreta.'}, {status: 401});
    }

    // verifica se o playerName é válido
    if (!playerName || playerName.trim() === '') {
      return NextResponse.json({error: 'Insira seu nome, jogador.'}, {status: 400});
    }

    return NextResponse.json({success: true});
  }
  catch (error) {
    return NextResponse.json({error: 'Erro do servidor ao autenticar.'}, {status: 500});
  }
}