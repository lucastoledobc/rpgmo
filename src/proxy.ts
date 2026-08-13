// arquivo: intercepta as requisições para as salas e valida o token JWT
// local: src/proxy.ts (ou na raiz do projeto)

import {NextRequest, NextResponse} from 'next/server';
import {jwtVerify} from 'jose';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('rpg_session')?.value;
  const {pathname} = request.nextUrl;

  // retira a URL: ["", "room", "SALA123"]
  const segments = pathname.split('/');
  const roomIndex = segments.indexOf('room') + 1;
  const roomFromUrl = segments[roomIndex];

  // sem token -> manda de volta para a Home
  const isApiRoute = pathname.startsWith('/api/');
  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({error: 'Não autenticado.'}, {status: 401});
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET não configurado.');
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    
    // Verifica e decodifica o token
    const {payload} = await jwtVerify(token, secret);
    
    const tokenRoom = payload.room as string;

    // verifica se a sala do token do jogador é a sala que ele está tentando acessar
    if (tokenRoom !== roomFromUrl) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }
  catch (error) {
    // Se o token for inválido ou expirado, limpa o cookie e redireciona
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('rpg_session');
    return response;
  }
}

// Configura o proxy para rodar APENAS nas rotas das salas
export const config = {
  matcher: ['/room/:path*', '/api/room/:path*'],
};
