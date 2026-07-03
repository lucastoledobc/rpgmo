import {NextResponse} from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request, {params}: {params: {id: string}}) {
  const {id} = params;
  const {mensagem, charId} = await request.json();
  const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${id}.json`);

  // 1. Ler estado atual da sala
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const room = JSON.parse(fileContent);

  // 2. Construir o Prompt para a IA
  const prompt = `
    Você é um Mestre de RPG. 
    Mundo: ${room.mundo.nome}. 
    Regras: ${room.mundo.regras}. 
    Personalização: ${room.mundo.personalizacao}.
    Estado Atual: ${room.mundo.estadoAtual}.
    Personagens na sala: ${JSON.stringify(room.personagens)}.
    Histórico: ${JSON.stringify(room.logAventura.slice(-5))}. // últimos 5 turnos
    
    Ação do jogador: ${mensagem}
  `;

  // 3. Chamar API da OpenAI (Exemplo)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${room.mestre.chaveAPI}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }]
    })
  });

  const aiResult = await response.json();
  const respostaMestre = aiResult.choices[0].message.content;

  // 4. Salvar no histórico da sala
  room.logAventura.push({ turno: room.logAventura.length + 1, texto: respostaMestre });
  await fs.writeFile(filePath, JSON.stringify(room, null, 2));

  return NextResponse.json({ resposta: respostaMestre });
}