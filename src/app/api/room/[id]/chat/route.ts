import {NextResponse} from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const {roomId, newMessage} = await request.json();
    const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${roomId}.json`);

    // Lê o arquivo atual da sala
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const roomData = JSON.parse(fileContent);

    // Adiciona a nova mensagem ao final do array
    roomData.chat.push(newMessage);

    // Salva o arquivo de volta no disco
    await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));

    return NextResponse.json({success: true});
  } 
  catch (error) {
    console.error("Erro ao salvar mensagem no chat:", error);
    return NextResponse.json({error: 'Erro ao enviar mensagem no servidor'}, {status: 500});
  }
}