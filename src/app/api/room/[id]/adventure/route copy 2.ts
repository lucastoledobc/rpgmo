import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { Mutex } from 'async-mutex';

const roomLocks: { [key: string]: Mutex } = {};
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roomId } = await params;
    const { action, playerName, char } = await request.json();
    const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${roomId}.json`);

    if (!roomLocks[roomId]) roomLocks[roomId] = new Mutex();

    // 1. Executamos TUDO dentro do Mutex e retornamos apenas o texto final
    const finalMasterResponse = await roomLocks[roomId].runExclusive(async () => {
      
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const roomData = JSON.parse(fileContent);

      // Proteção caso o char venha vazio do front-end
      const safeCharId = char?.id || 'SemID';
      const safeCharName = char?.name || 'Desconhecido';

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

      // 2. Análise de Intenção (Tratada de forma segura)
      let acaoAnalisada = { categoria: "OUTRO", alvo: "", resumoIntencao: "" };
      
      try {
        const intentAnalysis = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Analise a seguinte ação do jogador no RPG e classifique-a: "${action}"`,
          config: {
            systemInstruction: `Você é um motor de regras de RPG. Classifique a ação em uma destas categorias: AÇÃO_SIMPLES, APRESENTAÇÃO, DESCRIÇÃO, CONVERSA, COMBATE, USO_ITEM, PASSAGEM_DE_TEMPO, REGRA, OUTRO. Devolva também um resumo em uma frase da intenção real do jogador.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                categoria: { type: "string", enum: ["AÇÃO_SIMPLES", "APRESENTAÇÃO", "DESCRIÇÃO", "CONVERSA", "COMBATE", "USO_ITEM", "PASSAGEM_DE_TEMPO", "REGRA", "OUTRO"] },
                alvo: { type: "string" },
                resumoIntencao: { type: "string" }
              },
              required: ["categoria", "resumoIntencao"]
            }
          }
        });
        
        // Limpa possíveis marcações de código markdown caso a IA envie errado
        const rawText = (intentAnalysis.text || "{}").replace(/```json/g, '').replace(/```/g, '');
        acaoAnalisada = JSON.parse(rawText);
      } catch (error) {
        console.error("Erro na classificação de intenção. Assumindo OUTRO.", error);
        // Não encerramos a rota, apenas deixamos a categoria como OUTRO para a história não parar.
      }

      console.log("Categoria detectada:", acaoAnalisada.categoria);
      let instrucaoEspecifica = "";

      // 3. Switch seguro usando chaves específicas do bookData
      switch (acaoAnalisada.categoria) {
        case 'AÇÃO_SIMPLES':
          instrucaoEspecifica = `\nO jogador quer fazer algo simples. Continue a narração como consequência dessa ação.`;
          break;
        case 'APRESENTAÇÃO':
          instrucaoEspecifica = `\nO jogador encontrou ${acaoAnalisada.alvo}. Veja o contexto do mundo: ${bookData.history}. Faça uma apresentação de onde ele chegou focando em mistérios, sem iniciar lutas ainda.`;
          break;
        case 'DESCRIÇÃO':
          instrucaoEspecifica = `\nO jogador quer saber o que é ${acaoAnalisada.alvo}. Use o cenário: ${bookData.history}. Priorize os sentidos e deixe pistas do que há além.`;
          break;
        case 'CONVERSA':
          instrucaoEspecifica = `\nO jogador está conversando com ${acaoAnalisada.alvo}. Mantenha o tom do mundo baseando-se em: ${bookData.rules}. Narre a resposta do NPC.`;
          break;
        case 'COMBATE':
          instrucaoEspecifica = `\nO jogador ataca: ${acaoAnalisada.alvo || 'um inimigo'}. Regras de combate: ${bookData.rules}. Calcule se a ação faz sentido com os atributos de ${safeCharName} e descreva o impacto de forma visceral.`;
          break;
        case 'USO_ITEM':
          instrucaoEspecifica = `\nO jogador interage com: ${acaoAnalisada.alvo}. Descreva se ele obteve sucesso ou se falhou misteriosamente.`;
          break;
        case 'PASSAGEM_DE_TEMPO':
          instrucaoEspecifica = "\nAcelere a narrativa resumindo o tempo. Insira eventos menores apenas se o caminho for perigoso.";
          break;
        case 'REGRA':
          instrucaoEspecifica = `\nO jogador perguntou uma regra. Responda baseado em: ${bookData.rules}.`;
          break;
        default:
          instrucaoEspecifica = `\nO sistema não entendeu a intenção clara. Apenas narre a reação do mundo à ação.`;
          break;
      }

      // 4. Criação do Prompt Final
      const systemInstruction = `Você é o Mestre Narrador. 
      O mundo é: ${bookData.history}.
      As regras são: ${bookData.rules}.
      Personalidade: ${roomData.master.personality}.
      Personagens na sala: ${charsContext}.
      ${instrucaoEspecifica}
      Responda de forma curta, visceral e interpretativa. Não saia do personagem de Mestre.`;

      const atorDescricao = `${safeCharName} (jogado por ${playerName})`;
      console.log("Tamanho do prompt final:", systemInstruction.length);

      // 5. Chamada Final do Mestre
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Histórico:\n${recentHistory}\n\n${atorDescricao} declarou a ação: "${action}". Narre a consequência.`,
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 1000, // Limite seguro para não estourar tempo/tokens
        }
      });

      const aiResponseText = response.text || "O mestre observa em silêncio...";

      // 6. Gravar Arquivo
      roomData.log.push({
        sender: 'Mestre IA',
        text: aiResponseText,
        type: 'master'
      });

      await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));

      return aiResponseText; // Retorna o texto para sair do Mutex
    });

    // 7. Resposta da API
    return NextResponse.json({ success: true, masterResponse: finalMasterResponse });

  } catch (error) {
    console.error("ERRO COMPLETO NO BACKEND:", error);
    // Transforma o objeto de erro em texto para não dar falha de serialização
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: 'Erro ao invocar o Mestre', details: errorMsg }, { status: 500 });
  }
}