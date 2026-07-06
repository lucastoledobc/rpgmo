import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { Mutex } from 'async-mutex';

const roomLocks: { [key: string]: Mutex } = {};

// Inicializa a IA com a chave do seu .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roomId } = await params;
    const { action, playerName } = await request.json();

    const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${roomId}.json`);
    
    if (!roomLocks[roomId]) roomLocks[roomId] = new Mutex();

    let aiResponseText = "";

    // Usamos o Mutex para ninguém corromper o arquivo enquanto a IA pensa
    await roomLocks[roomId].runExclusive(async () => {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const roomData = JSON.parse(fileContent);

      if (!roomData.adventure) roomData.adventure = [];

      // 1. Salva a ação que o jogador acabou de digitar no histórico
      roomData.adventure.push({
        sender: playerName,
        text: action,
        type: 'player'
      });

      // 2. Cria o Contexto do RPG para a IA não se perder
      // Passamos os personagens da sala para ela saber quem está jogando
      const charsContext = roomData.chars?.map((c: any) => `${c.name} (Status: ${JSON.stringify(c.status)})`).join(', ') || 'Nenhum';
      
      // Pegamos as últimas 10 linhas da aventura para servir de memória para a IA
      const recentHistory = roomData.adventure.slice(-10).map((h: any) => `${h.sender}: ${h.text}`).join('\n');

      const systemInstruction = `Você é o Mestre Narrador de uma aventura de RPG de texto Retrô. 
      Os personagens na sala são: ${charsContext}.
      Seja imersivo, direto, descreva as consequências das ações dos jogadores e termine sempre instigando o próximo passo. 
      Não saia do personagem de Mestre. Responda em formato de texto interpretativo curto.`;

      // 3. CHAMA A IA
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Modelo ultra rápido ideal para chat de jogos
        contents: `Histórico recente da aventura:\n${recentHistory}\n\nO jogador ${playerName} declarou a ação: "${action}". Narre a consequência e continue a história.`,
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 300,
        }
      });

      aiResponseText = response.text || "O mestre observa em silêncio...";

      // 4. Salva a resposta do Mestre IA no histórico do JSON
      roomData.adventure.push({
        sender: 'Mestre IA',
        text: aiResponseText,
        type: 'master'
      });

      // Grava tudo atualizado no arquivo
      await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));
    });

    return NextResponse.json({ success: true, masterResponse: aiResponseText });

  } catch (error) {
    console.error("Erro na rota do Mestre IA:", error);
    return NextResponse.json({ error: 'Erro ao invocar o Mestre' }, { status: 500 });
  }
}