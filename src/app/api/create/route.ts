import {NextResponse} from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const INDEX_PATH = path.join(process.cwd(), 'src', 'data', 'rooms.json');

export async function POST(request: Request) {
  try {
    const {formData, newId, data} = await request.json();
    let roomData

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
    if (index.includes(newId)) {
      return NextResponse.json({error: 'ID já existe'}, {status: 409});
    }

    // se ja existe, pega os valores do json antigo e coloca o novo ID
    if (data) {
      let roomData = data;
      roomData.info.id = newId
    }
    else {
      const roomInfo = {
        id: newId,
        name: formData.name,
        pass: formData.pass,
        date: new Date().toISOString(),
      };
      
      const roomWorld = {
        id: formData.worldId,
        history: '',
        rules: "Sistema d6 simplificado: toda ação necassária é decidido no d6.",
        custom: formData.custom
      }

      if (roomWorld.id != "personalizado") {
        // Remove espaços do nome do mundo para casar com o arquivo
        const nomeArquivo = roomWorld.id.replace(/\s+/g, '') + '.json';
        const livroPath = path.join(process.cwd(), 'src', 'data', 'livros', nomeArquivo);
        const livroContent = await fs.readFile(livroPath, 'utf-8');
        const livro = JSON.parse(livroContent);
        
        roomWorld.history = livro.historia;
        roomWorld.rules = livro.regras;
      }

      const roomMaster = {
        system: "gpt-4o",
        apikey: "",
        personality: "Classic RPG Master, descriptive and fair."
      };

      roomData = {
        info: roomInfo,
        world: roomWorld,
        master: roomMaster,
        chars: [],
        logAdventure: []
      }
    }    

    // Salvar o arquivo da sala
    const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${newId}.json`);
    await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));

    // Atualiza o índice
    index.push(newId);
    await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));

    return NextResponse.json({success: true, newId}, {status: 201});
  }
  catch (error) {
    return NextResponse.json({error: 'Erro no servidor'}, {status: 500});
  }
}