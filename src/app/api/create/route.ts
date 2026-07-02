import {NextResponse} from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const INDEX_PATH = path.join(process.cwd(), 'src', 'data', 'rooms.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {id, nome, senha, mundo, personalizacao} = body;
    
    // Lê o índice de salas existentes
    let index = [];
    try {
      const indexData = await fs.readFile(INDEX_PATH, 'utf-8');
      index = JSON.parse(indexData);
    }
    catch {
      // Se não existir, o índice começa vazio
    }

    // Verifica duplicidade
    if (index.includes(id)) {
      return NextResponse.json({error: 'ID já existe'}, {status: 409});
    }

    // Salvar o arquivo da sala
    const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${id}.json`);
    const roomData = {id, nome, senha, mundo, personalizacao [], criadoEm: new Date().toISOString()};
    await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));

    // Atualiza o índice
    index.push(id);
    await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));

    return NextResponse.json({success: true, id}, {status: 201});
  }
  catch (error) {
    return NextResponse.json({error: 'Erro no servidor'}, {status: 500});
  }
}