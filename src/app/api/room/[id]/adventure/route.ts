import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Mutex } from 'async-mutex';

const roomLocks: { [key: string]: Mutex } = {};

// Função auxiliar para chamar o Ollama local
async function callOllama(promptData: { system: string, user: string, model?: string, format?: string }) {
const modelName = promptData.model || 'llama3.1:8b';

  const response = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: promptData.system },
        { role: 'user', content: promptData.user }
      ],
      stream: false,
      format: promptData.format // Mágico para forçar JSON na primeira etapa!
    })
  });

  if (!response.ok) {
    throw new Error(`Falha no Ollama: ${response.statusText}`);
  }

  const data = await response.json();
  return data.message.content;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roomId } = await params;
    const { action, playerName, char } = await request.json();
    const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${roomId}.json`);

    if (!roomLocks[roomId]) roomLocks[roomId] = new Mutex();

    const finalMasterResponse = await roomLocks[roomId].runExclusive(async () => {
      
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const roomData = JSON.parse(fileContent);

      const safeCharId = char?.id || 'SemID';
      const safeCharName = char?.name || 'Desconhecido';

      // 1. Salva a ação do jogador
      roomData.log.push({
        sender: playerName,
        charId: safeCharId,
        charName: safeCharName,
        text: action,
        type: 'player'
      });

      const bookPath = path.join(process.cwd(), 'src', 'data', 'books', `${roomData.world.book}.json`);
      const bookData = JSON.parse(await fs.readFile(bookPath, 'utf-8'));

      const charsContext = roomData.chars?.map((c: any) => `${c.name} (Status: ${JSON.stringify(c.status)})`).join(', ') || 'Nenhum';
      const recentHistory = roomData.log.slice(-10).map((h: any) => `${h.sender}: ${h.text}`).join('\n');

      // 2. Análise de Intenção com Ollama (Forçando JSON)
      let acaoAnalisada = { categoria: "OUTRO", alvo: "", resumoIntencao: "" };
      
      try {
        console.log("Analisando intenção com Ollama...");
        const intentJsonStr = await callOllama({
          system: `Classifique a ação do jogador nas categorias: AÇÃO_SIMPLES, APRESENTAÇÃO, DESCRIÇÃO, CONVERSA, COMBATE, USO_ITEM, PASSAGEM_DE_TEMPO, REGRA, OUTRO. 
          Retorne EXCLUSIVAMENTE um objeto JSON válido com as chaves "categoria" (string), "alvo" (string), "resumoIntencao" (string).`,
          user: `Ação: "${action}"`,
          format: "json" // O Ollama vai travar a saída para ser APENAS json válido
        });
        
        acaoAnalisada = JSON.parse(intentJsonStr);
      } catch (error) {
        console.error("Erro na classificação com Ollama. Assumindo OUTRO.", error);
      }

      console.log("Categoria detectada:", acaoAnalisada.categoria);
      let instrucaoEspecifica = "";

      // 3. Modifica o contexto baseado na intenção
      switch (acaoAnalisada.categoria) {
        case 'AÇÃO_SIMPLES':
          instrucaoEspecifica = `\nO jogador quer fazer algo simples. Continue a narração como consequência.`;
          break;
        case 'APRESENTAÇÃO':
          instrucaoEspecifica = `\nO jogador encontrou ${acaoAnalisada.alvo}. Veja o contexto do mundo: ${bookData.history}. Faça uma apresentação de onde ele chegou focando em mistérios.`;
          break;
        case 'DESCRIÇÃO':
          instrucaoEspecifica = `\nO jogador quer saber sobre ${acaoAnalisada.alvo}. Use o cenário: ${bookData.history}. Priorize os sentidos.`;
          break;
        case 'CONVERSA':
          instrucaoEspecifica = `\nConversa com ${acaoAnalisada.alvo}. Mantenha o tom do mundo baseado em: ${bookData.rules}. Narre a resposta do NPC.`;
          break;
        case 'COMBATE':
          instrucaoEspecifica = `\nAtaque a: ${acaoAnalisada.alvo || 'um inimigo'}. Regras: ${bookData.rules}. Calcule o resultado baseado em ${safeCharName} e descreva o impacto de forma visceral.`;
          break;
        case 'USO_ITEM':
          instrucaoEspecifica = `\nInteração com: ${acaoAnalisada.alvo}. Descreva se obteve sucesso ou falhou misteriosamente.`;
          break;
        case 'PASSAGEM_DE_TEMPO':
          instrucaoEspecifica = "\nAcelere a narrativa resumindo o tempo transcorrido.";
          break;
        case 'REGRA':
          instrucaoEspecifica = `\nResponda sobre a regra baseado em: ${bookData.rules}.`;
          break;
        default:
          instrucaoEspecifica = `\nApenas narre a reação do mundo à ação.`;
          break;
      }

      // 4. Criação do Prompt Final
      const systemInstruction = `Você é o Mestre Narrador de RPG. 
      Mundo: ${bookData.history}.
      Regras: ${bookData.rules}.
      Sua Personalidade: ${roomData.master.personality}.
      Personagens na sala: ${charsContext}.
      ${instrucaoEspecifica}
      Responda de forma interpretativa. Não descreva as ações do jogador, descreva como o mundo reage a elas.`;

      const atorDescricao = `${safeCharName} (jogado por ${playerName})`;
      
      console.log("Chamando o Mestre Ollama para narrar...");

      // 5. Chamada Final do Mestre (Sem forçar JSON, pois queremos texto corrido)
      const aiResponseText = await callOllama({
        system: systemInstruction,
        user: `Histórico:\n${recentHistory}\n\n${atorDescricao} declarou a ação: "${action}". Narre a consequência.`,
      });

      // 6. Gravar Arquivo
      roomData.log.push({
        sender: 'Mestre IA',
        text: aiResponseText || "O mestre observa em silêncio...",
        type: 'master'
      });

      await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));

      return aiResponseText; 
    });

    return NextResponse.json({ success: true, masterResponse: finalMasterResponse });

  } catch (error) {
    console.error("ERRO COMPLETO NO BACKEND (Ollama):", error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    // Se der ECONNREFUSED, significa que o Ollama não está aberto no PC
    if (errorMsg.includes('fetch failed') || errorMsg.includes('ECONNREFUSED')) {
      return NextResponse.json({ error: 'Erro de Conexão', details: 'O servidor do Ollama não está rodando. Abra o Ollama no seu PC.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Erro ao invocar o Mestre', details: errorMsg }, { status: 500 });
  }
}