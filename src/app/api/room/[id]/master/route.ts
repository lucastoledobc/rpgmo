import {NextResponse} from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {Mutex} from 'async-mutex';

const roomLocks: {[key: string]: Mutex} = {};

export async function POST(request: Request, {params}: {params: Promise<{id: string }>}) {
  try {
    const {id: roomId} = await params;
    
    // Extrai os dados enviados pelo seu form (Master.js)
    const body = await request.json();
    const {system, model, contextSize, personality, systemInstruction} = body;

    // Caminho para o JSON da sala
    const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${roomId}.json`);

    // Inicializa o Mutex para esta sala caso não exista
    if (!roomLocks[roomId]) {
        roomLocks[roomId] = new Mutex();
    }

    // Abre a trava exclusiva para edição
    await roomLocks[roomId].runExclusive(async () => {
      // Lê o estado atual da sala
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const roomData = JSON.parse(fileContent);

      // Garante que o objeto master existe no JSON antes de alterá-lo
      if (!roomData.master) {
          roomData.master = {};
      }

      // Atualiza os valores com os dados recebidos do form ou mantemos
      roomData.master.system = system || roomData.master.system;
      roomData.master.model = model || roomData.master.model;
      roomData.master.personality = personality || roomData.master.personality;      
      
      // Converte o contextSize para número para manter o JSON limpo
      if (contextSize) {
          roomData.master.contextSize = Number(contextSize) || roomData.master.contextSize;
      }

      // Se você decidir usar systemInstruction separadamente depois:
      if (systemInstruction !== undefined) {
          roomData.master.systemInstruction = systemInstruction;
      }

      // 4. Salva o arquivo sobrescrevendo com os novos dados
      await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));
    });

    return NextResponse.json({success: true, message: "Configurações do Mestre salvas com sucesso!"});

  }
  catch (error) {
    console.error("Erro ao salvar configuração do mestre:", error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
        {error: 'Falha ao salvar configuração', details: errorMsg}, 
        {status: 500}
    );
  }
}