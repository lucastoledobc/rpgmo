// arquivo: route do login
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
      return NextResponse.json({ error: 'Sala, senha e nome do jogador são obrigatórios.' }, {status: 400});
    }

    // verifica se o playerName é válido
    if (!playerName || playerName.trim() === '') {
      return NextResponse.json({error: 'Insira seu nome, jogador.'}, {status: 400});
    }

    // verifica a sala na db
    const [roomRow] = await db.select().from(campaigns).where(eq(campaigns.room, room));
    if (!roomRow) {
      return NextResponse.json({error: 'Sala ou senha incorretos.'}, {status: 404});
    }

    // verifica a senha
    const senhaValida = await bcrypt.compare(pass, roomRow.passHash);
    if (!senhaValida) {
      return NextResponse.json({error: 'Sala ou senha incorretos.'}, {status: 401});
    }

    // configura a chave secreta codificada
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    
    // Cria o token incluindo os dados necessários para a sessão
    const token = await new SignJWT({playerName, room})
      .setProtectedHeader({alg: 'HS256'})
      .setExpirationTime('20h') // Tempo de duração da sessão do jogo
      .sign(secret);

    const response = NextResponse.json({success: true});

    // Salva o token em um cookie HTTP-Only (inacessível via JavaScript do front)
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
    return NextResponse.json({error: 'Erro do servidor ao autenticar.'}, {status: 500});
  }
}