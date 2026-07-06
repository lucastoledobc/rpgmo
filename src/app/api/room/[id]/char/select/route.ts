import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Mutex } from 'async-mutex';

// Reaproveitamos o mesmo mapa de travas para evitar conflitos de escrita na sala
const roomLocks: { [key: string]: Mutex } = {};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roomId } = await params;
    const { charId, playerId } = await request.json();

    const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${roomId}.json`);

    // Inicializa a trava da sala se não existir
    if (!roomLocks[roomId]) {
      roomLocks[roomId] = new Mutex();
    }

    let success = false;
    let errorMessage = '';

    // Executa a operação de forma exclusiva na fila
    await roomLocks[roomId].runExclusive(async () => {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const roomData = JSON.parse(fileContent);

      // Encontra o índice do personagem que o jogador quer selecionar
      const charIndex = roomData.chars.findIndex((c: any) => c.id === charId);

      if (charIndex === -1) {
        errorMessage = 'Personagem não encontrado.';
        return;
      }

      // Trava de segurança: Verifica se outro jogador já não escolheu ele na mesma fração de segundo
      if (roomData.chars[charIndex].player && roomData.chars[charIndex].player !== playerId) {
        errorMessage = 'Este personagem já foi escolhido por outro jogador.';
        return;
      }

      // Atribui o ID do player ao personagem
      roomData.chars[charIndex].player = playerId;

      // Salva as alterações no arquivo JSON da sala
      await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));
      success = true;
    });

    if (!success) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } 
  catch (error) {
    console.error("Erro ao vincular personagem:", error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}