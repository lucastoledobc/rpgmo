import {NextResponse} from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request, {params}: {params: {id: string}}) {
  try {
    const {id: roomId} = await params;
    const charData = await request.json();
    
    // Caminho do arquivo da sala
    const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${roomId}.json`);

    if (charData.id == 'new') {
      charData.id = `char_${Date.now()}`;
      console.log("charData.id");
    }

    // Lê a sala atual
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const roomData = JSON.parse(fileContent);

    // Verifica se o personagem já existe para atualizar
    const charIndex = roomData.personagens.findIndex((p: any) => p.id === charData.id);

    if (charIndex !== -1) {
      // Atualiza personagem existente
      roomData.personagens[charIndex] = charData;
    } else {
      // Adiciona novo personagem
      roomData.personagens.push(charData);
    }

    // Salvar o arquivo atualizado
    await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));

    return NextResponse.json({ success: true });
  }
  catch (error) {
    console.error("Erro ao salvar personagem:", error);
    return NextResponse.json({ error: 'Erro ao salvar no servidor' }, {status: 500});
  }
}