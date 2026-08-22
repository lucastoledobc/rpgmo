// arquivo: rota do login
// local: src\app\api\auth\route.ts

import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {campaigns} from '@/db/schema';
import bcrypt from 'bcryptjs';
import {SignJWT} from 'jose';

export async function POST(request: Request) {
  try {
    // recebe do front
    let {room, pass, playerName} = await request.json();

    // valida os campos recebidos
    room = typeof room === 'string' ? room.trim().toUpperCase() : '';
    pass = typeof pass === 'string' ? pass.trim() : '';
    playerName = typeof playerName === 'string' ? playerName.trim() : '';

    // verifica se os campos estão preenchidos
    if (!room || !pass || !playerName) {
      return NextResponse.json({error: 'Preencha todos os campos.'}, {status: 400});
    }

    // verifica a sala na db
    const [roomRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!roomRow) {
      return NextResponse.json({error: 'Sala ou senha incorretos.'}, {status: 401});
    }

    // verifica a senha
    const senhaValida = await bcrypt.compare(pass, roomRow.passHash);
    if (!senhaValida) {
      return NextResponse.json({error: 'Sala ou senha incorretos.'}, {status: 401});
    }

    // configura a chave secreta codificada
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET não configurado.');
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    
    // Cria o token no lado do servidor
    const token = await new SignJWT({playerName, room})
      .setProtectedHeader({alg: 'HS256'})
      .setExpirationTime('20h')
      .sign(secret);

    // Salva o token em um cookie HTTP-Only (inacessível via JavaScript do front)
    const response = NextResponse.json({success: true});
    response.cookies.set('rpg_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600 * 20, // 20 horas em segundos
      path: '/',
    });

    return response;
  }
  catch (error) {
    console.error("Erro capturado:", error);
    return NextResponse.json({error: 'Erro do servidor ao autenticar.'}, {status: 500});
  }
}