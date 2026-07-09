import {NextResponse} from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  const {id, pass} = await request.json();
  const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${id}.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const roomData = JSON.parse(fileContent);

    if (roomData.room.pass != pass) {
      return NextResponse.json({error: 'Senha incorreta.'}, {status: 401});
    }
    
    // cria um id para o jogador
    const playerId = `player_${Math.random().toString(6).replace('0.', '')}`;
    // if (!roomData.room.players.includes(playerId)) {
    //   roomData.room.players.push(playerId);
    // }
    await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));

    return NextResponse.json({success: true, playerId});
  }
  catch (e) {
    return NextResponse.json({error: 'id não encontrada.'}, {status: 404});
  }
}