import {NextResponse} from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {Mutex} from 'async-mutex';

const roomLocks: {[key: string]: Mutex} = {};

// ---------- Tipos ----------

interface OllamaMaster {
  system?: string;
  model: string;
  contextSize?: number;
  temperature: number;
  top_p: number;
  repeat_penalty: number;
  personality?: string;
  systemInstruction: string;
}

interface OllamaPrompt {
  system: string;
  user: string;
}

interface OllamaRequestBody {
  model: string;
  system: string;
  prompt: string;
  stream: boolean;
  format?: string;
  options: {
    num_ctx?: number;
    temperature: number;
    top_p: number;
    repeat_penalty: number;
  };
}

interface actionType {
  category: string;
  object: string;
  objectType: 'place' | 'person' | 'monster' | 'item' | 'none';
}

interface actionPayload {
  playerName: string;
  char: any | null;
  action: string;
}

// ---------- Cliente Ollama ----------

async function callOllama({master, prompt, format, options}: {master: OllamaMaster; prompt: OllamaPrompt; format?: string | null, options?: any | null}): Promise<string> {
  const body: OllamaRequestBody = {
    model: master.model,
    system: prompt.system,
    prompt: prompt.user,
    stream: false, // só envie a resposta quando ela estiver pronta
    options: {
      num_ctx: master.contextSize,
      temperature: options?.temperatura || master.temperature,
      top_p: options?.top_p || master.top_p,
      repeat_penalty: options?.top_p || master.repeat_penalty
    }
  };

  if (format) {
    body.format = format;
  }

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Erro na API do Ollama: ${response.statusText}`);
  }
  console.log("Instrução: ", prompt);
  const data = await response.json();
  return data.response;
}

// ---------- Functions ----------

function validatePayload(payload: any): payload is actionPayload {
  return Boolean(payload?.action && payload?.char?.id && payload?.char?.name);
}

async function loadRoom(roomId: string) {
  const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${roomId}.json`);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return {filePath, roomData: JSON.parse(fileContent)};
}

function printAction(roomData: any, {playerName, char, action}: actionPayload) {
  roomData.log.push({
    sender: char ? playerName : roomData.master.model,
    charId: char?.id ?? 0,
    charName: char?.name ?? "Mestre",
    text: action,
    type: char ? 'player' : 'master'
  });
}

async function loodBook(bookId: string) {
  const bookPath = path.join(process.cwd(), 'src', 'data', 'books', `${bookId}.json`);
  return JSON.parse(await fs.readFile(bookPath, 'utf-8'));
}

async function analyzeAction(master: OllamaMaster, action: string): Promise<actionType> {
  const fallback: actionType = {category: "OUTRO", object: "", objectType: "none"};

  if (master.system !== 'ollama') return fallback;

  try {
    console.log("Analisando ação com Ollama...");
    const intentJsonStr = await callOllama({
      master,
      prompt: {
        system: `Qual é a categoria da ação do jogador?
          - AÇÃO_SIMPLES: o jogador fez algo rotineiro, sem risco ou objeto novo envolvido (beber água, sentar, olhar ao redor, andar, descansar).
          - AÇÃO_COMPLEXA: o jogador tenta algo arriscado ou que exige teste de habilidade, mas não é combate nem usa item (escalar um muro, arrombar uma porta, saltar um abismo).
          - APRESENTAÇÃO: o jogador CHEGA a um lugar novo ou VÊ algo pela primeira vez que precisa ser descrito ao jogador (entrar numa sala, avistar uma criatura, encontrar uma estrutura).
          - DESCRIÇÃO: o jogador PERGUNTA explicitamente sobre algo que já existe na cena ("o que é isso?", "como é a taverna?").
          - CONVERSA: o jogador fala com um NPC específico.
          - COMBATE: o jogador ataca ou é atacado.
          - USO_ITEM: o jogador usa um item do inventário ou do cenário com um propósito específico (beber uma poção, acender uma tocha, usar uma chave).
          - PASSAGEM_DE_TEMPO: o jogador pula adiante no tempo (descansar até o dia seguinte, esperar).
          - REGRA: o jogador pergunta sobre uma regra do jogo, não sobre a história.
          - OUTRO: nenhuma das anteriores se aplica.

          Exemplos:
          Ação: "quero beber água" -> {"category": "AÇÃO_SIMPLES", "object": "água", "objectType": "none"}
          Ação: "bebo a poção vermelha do meu inventário" -> {"category": "USO_ITEM", "object": "poção vermelha", "objectType": "item"}
          Ação: "entro na caverna escura" -> {"category": "APRESENTAÇÃO", "object": "caverna escura", "objectType": "place"}
          Ação: "o que é aquela estátua?" -> {"category": "DESCRIÇÃO", "object": "estátua", "objectType": "none"}
          Ação: "ataco o goblin" -> {"category": "COMBATE", "object": "goblin", "objectType": "monster"}

          Retorne EXCLUSIVAMENTE o JSON, sem texto adicional, com as chaves "category" (string), "object" (string), "objectType" (string: place|person|monster|item|none).`,
        user: `Ação: "${action}"`
      },
      format: "json",
      options: {temperature: 0.1}
    });

    const parsed = JSON.parse(intentJsonStr);
    // valida o shape antes de confiar (ligado ao ponto 5 da sua lista anterior)
    const validTypes = ['place', 'person', 'monster', 'item', 'none'];
    if (!validTypes.includes(parsed.objectType)) parsed.objectType = 'none';

    return parsed;
  }
  catch (error) {
    console.error("Erro na classificação de intenção. Assumindo OUTRO.", error);
    return fallback;
  }
}


// Dicionário de instruções FOCADO APENAS no que o Mestre deve fazer.
function actionTypes(a: actionType): string {
  switch (a.category) {
    case 'AÇÃO_SIMPLES':
      return `\n[DIREÇÃO]: O jogador quer fazer algo simples. Continue a narração como consequência direta e objetiva.`;
    case 'AÇÃO_COMPLEXA':
      return `\n[DIREÇÃO]: O jogador quer fazer algo complexo. Peça uma rolagem de dados (teste) para ver se ele consegue antes de narrar a consequência final.`;
    case 'APRESENTAÇÃO':
      return `\n[DIREÇÃO]: O jogador encontrou/entrou em ${a.object}. Descreva o que ele vê focando na atmosfera e no mistério.`;
    case 'DESCRIÇÃO':
      return `\n[DIREÇÃO]: O jogador quer examinar ou saber mais sobre ${a.object}. Responda priorizando os 5 sentidos.`;
    case 'CONVERSA':
      return `\n[DIREÇÃO]: Diálogo com ${a.object}. Interprete o NPC e narre a sua resposta de acordo com a personalidade dele.`;
    case 'COMBATE':
      return `\n[DIREÇÃO]: Ataque contra ${a.object || 'um inimigo'}. Calcule o resultado. Descreva o impacto, o dano e a reação de forma visceral.`;
    case 'USO_ITEM':
      return `\n[DIREÇÃO]: Interação com o item/objeto ${a.object}. Exija uma rolagem se necessário, e descreva o sucesso ou falha do uso de forma instigante.`;
    case 'PASSAGEM_DE_TEMPO':
      return `\n[DIREÇÃO]: Acelere a narrativa, resumindo rapidamente as horas ou dias que se passaram.`;
    case 'REGRA':
      return `\n[DIREÇÃO]: O jogador está perguntando sobre as regras do jogo. Responda baseando-se nas regras do livro que você possui em seu sistema base.`;
    case 'OUTRO':
    default:
      return `\n[DIREÇÃO]: Ação confusa ou impossível. Como mestre, pergunte ao jogador para explicar melhor o que ele está tentando fazer.`;
  }
}

// Extrator de Lore isolado: Traz APENAS o trecho útil, já em formato de texto para o prompt.
function getLoreContext(objectName: string, objectType: string, bookData: any): string {
  if (!objectType || !objectName || objectType === 'none') return '';

  const target = objectName.toLowerCase();
  let found = null;

  // Busca o item específico na lista correspondente
  switch (objectType) {
    case 'place':
      found = bookData.places?.find((p: any) => p.nome.toLowerCase().includes(target));
      return found ? `\n[LORE DO LOCAL]: ${JSON.stringify(found)}` : '';
    case 'person':
      found = bookData.chars?.find((c: any) => c.nome.toLowerCase().includes(target));
      return found ? `\n[FICHA DO NPC]: ${JSON.stringify(found)}` : '';
    case 'monster':
      found = bookData.monsters?.find((m: any) => m.tipo.toLowerCase().includes(target));
      return found ? `\n[STATUS DO INIMIGO]: ${JSON.stringify(found)}` : '';
    case 'item':
      found = bookData.items?.find((i: any) => i.nome.toLowerCase().includes(target));
      return found ? `\n[ATRIBUTOS DO ITEM]: ${JSON.stringify(found)}` : '';
    default:
      return '';
  }
}

// Montador final: Junta a direção e a ficha técnica (se existir).
function buildNewInstruction(actionAnalized: any, bookData: any): string {
  // Pega a instrução de como narrar
  const direction = actionTypes(actionAnalized);

  // Pega o trecho do livro (só traz se o objeto existir, se não, é vazio)
  const loreData = getLoreContext(actionAnalized.object, actionAnalized.objectType, bookData);

  // Retorna a instrução montada para o segundo prompt da IA
  return `${direction}. ${loreData}`;
}

function buildHistoryByBudget(roomData: any, charBudget: number = 2000): string {
  const entries: string[] = [];
  let usedChars = 0;

  // percorre do mais recente pro mais antigo
  for (let i = roomData.log.length - 1; i >= 0; i--) {
    const entry = roomData.log[i];
    const line = `${entry.charName}: ${entry.text}`;

    if (usedChars + line.length > charBudget) break;

    entries.unshift(line); // mantém ordem cronológica
    usedChars += line.length;
  }

  return entries.join('\n') || 'Nenhum histórico ainda.';
}

async function callMaster({
  roomData,
  newInstruction, 
  char, 
  action}: {
    roomData: any;
    newInstruction: string; 
    char: {name: string}; 
    action: string}): Promise<string> {
  const master: OllamaMaster = roomData.master;

  if (master.system == 'ollama') {
    const recentHistory = buildHistoryByBudget(roomData, 2000);
    

    try {
      return await callOllama({
        master,
        prompt: {
          system: `
          Você é um Mestre de RPG. 
          Sua Personalidade: ${master.personality}.
          Personagens na sala: ${JSON.stringify(roomData.chars.map((c: {name: any;}) => c.name))}.

          Últimas jogadas: 
          ${recentHistory}

          Instrução Principal:
          ${master.systemInstruction}

          Situação Atual:
          ${newInstruction}`,
          user: `${char.name} declarou a ação: "${action}".`
        },
        format: null
      });
    }
    catch (error) {
      console.error("Erro ao chamar o Mestre Ollama:", error);
      return "O mestre observa em silêncio...";
    }
  }
  else {
    console.warn(`Master system "${master.system}" ainda não implementado.`);
    return "O Mestre configurado para esta sala ainda não está disponível.";
  }
}

// ---------- Route ----------

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    // recebe os parâmetros
    const {id: roomId} = await params;
    const payload = await request.json();

    // verifica se ação e personagem são válidos
    if (!validatePayload(payload)) {
      return NextResponse.json({error: 'Ação ou personagem inválido'}, {status: 400});
    }

    // trava a sala para o arquivo não corromper
    if (!roomLocks[roomId]) roomLocks[roomId] = new Mutex();
    const finalMasterResponse = await roomLocks[roomId].runExclusive(async () => {
      const {filePath, roomData} = await loadRoom(roomId);

      // verifica se tem uma IA configurada
      if (!roomData.master?.system) {
        throw new Error('Sala sem Mestre (IA) configurado.');
      }

      // escreve a ação do jogador
      printAction(roomData, payload);

      // pega o livro
      const bookData = await loodBook(roomData.world.book);

      // analiza e classifica a ação do jogador
      const actionAnalized = await analyzeAction(roomData.master, payload.action);
      console.log("Ação analizada: ", actionAnalized);

      // escreve uma instrução para aquele tipo de ação
      const newInstruction = buildNewInstruction(actionAnalized, bookData);
      console.log("Instrução personalizada: ", newInstruction);

      // chama o mestre com a instrução criada
      console.log(`Chamando o Mestre ${roomData.master.model} para narrar...`);
      const aiResponseText = await callMaster({
        roomData,
        newInstruction, 
        char: payload.char, 
        action: payload.action
      });

      // escreve a narração do mestre
      printAction(roomData, {playerName: "master", char: null, action: aiResponseText});
      await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));

      return aiResponseText;
    });

    return NextResponse.json({success: true, masterResponse: finalMasterResponse});
  }
  catch (error) {
    console.error("ERRO COMPLETO NO BACKEND (Ollama):", error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";

    if (errorMsg.includes('fetch failed') || errorMsg.includes('ECONNREFUSED')) {
      return NextResponse.json({error: 'Erro de Conexão', details: 'O servidor do Ollama não está rodando. Abra o Ollama no seu PC.'}, {status: 500});
    }

    return NextResponse.json({error: 'Erro ao invocar o Mestre', details: errorMsg}, {status: 500});
  }
}

// Mundo: ${JSON.stringify(bookData.history)}.
          // Regras: ${JSON.stringify(bookData.rules)}.
          // Sua Personalidade: ${master.personality}.