import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { Mutex } from 'async-mutex';

const roomLocks: { [key: string]: Mutex } = {};
// Inicializa o Claude
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

      // 2. Análise de Intenção com o Claude (Haiku é mais rápido para isso)
      let acaoAnalisada = { categoria: "OUTRO", alvo: "", resumoIntencao: "" };
      
      try {
        const intentAnalysis = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307', // Modelo rápido e barato
          max_tokens: 300,
          system: `Você é um motor de regras de RPG. Classifique a ação em uma destas categorias: AÇÃO_SIMPLES, APRESENTAÇÃO, DESCRIÇÃO, CONVERSA, COMBATE, USO_ITEM, PASSAGEM_DE_TEMPO, REGRA, OUTRO. 
          Você DEVE retornar EXCLUSIVAMENTE um objeto JSON válido, sem nenhum texto adicional ou formatação markdown, com as chaves: "categoria" (string), "alvo" (string, deixe vazio se não houver) e "resumoIntencao" (string).`,
          messages: [
            { role: "user", content: `Analise a seguinte ação do jogador no RPG e classifique-a: "${action}"` }
          ]
        });
        
        // Pega o texto da resposta do Claude
        let intentText = "";
        if (intentAnalysis.content[0].type === 'text') {
            intentText = intentAnalysis.content[0].text;
        }

        // Limpa possíveis marcações de código markdown
        const rawText = intentText.replace(/```json/g, '').replace(/```/g, '').trim();
        acaoAnalisada = JSON.parse(rawText);
      } catch (error) {
        console.error("Erro na classificação de intenção com Claude. Assumindo OUTRO.", error);
      }

      console.log("Categoria detectada:", acaoAnalisada.categoria);
      let instrucaoEspecifica = "";

      // 3. Switch seguro 
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
      console.log("Chamando o Mestre Claude...");

      // 5. Chamada Final do Mestre com Sonnet (excelente para narração)
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022', // Pode trocar por claude-3-haiku-20240307 se quiser economizar
        max_tokens: 1000,
        system: systemInstruction,
        messages: [
            { role: "user", content: `Histórico:\n${recentHistory}\n\n${atorDescricao} declarou a ação: "${action}". Narre a consequência.` }
        ]
      });

      let aiResponseText = "O mestre observa em silêncio...";
      if (response.content[0].type === 'text') {
          aiResponseText = response.content[0].text;
      }

      // 6. Gravar Arquivo
      roomData.log.push({
        sender: 'Mestre IA',
        text: aiResponseText,
        type: 'master'
      });

      await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));

      return aiResponseText; 
    });

    return NextResponse.json({ success: true, masterResponse: finalMasterResponse });

  } catch (error) {
    console.error("ERRO COMPLETO NO BACKEND (Claude):", error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: 'Erro ao invocar o Mestre', details: errorMsg }, { status: 500 });
  }
}