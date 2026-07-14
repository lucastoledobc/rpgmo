// arquivo: route do histórico e narração da aventura
// local: src\app\api\room\[id]\adventure\route.ts

import {NextResponse} from 'next/server';
import {eq, asc} from 'drizzle-orm';
import {db} from '@/db';
import {rooms, adventures, worlds, masters, characters, adventureLogs} from '@/db/schema';

// ---------- Tipos ----------

interface OllamaMaster {
  system: string;
  model: string;
  contextSize: number | null;
  temperature: number | null;
  repeatPenalty: number | null;
  numPredict: number | null;
  personality: string | null;
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
    num_predict?: number;
    repeat_penalty?: number;
    temperature?: number;
  };
}

interface ActionType {
  category: string;
  object: string;
  objectType: 'place' | 'person' | 'monster' | 'item' | 'none';
}

interface ActionPayload {
  playerName: string;
  char: any;
  action: string;
}

// ---------- Cabeçalho fixo de instrução ----------

const MASTER_HEADER = `Regras fixas de formato, sempre válidas:
- Nunca repita a mesma descrição sensorial (cheiros, sons, texturas) usada na sua resposta anterior; varie o vocabulário.
- Responda em no máximo 3 parágrafos curtos.
- Termine sempre com uma única pergunta objetiva ao jogador, nunca mais de uma.
- Nunca fale pelo jogador nem decida a ação dele; apenas narre a consequência do que ele fez.`;

// ---------- Cliente Ollama ----------

async function callOllama({master, prompt, format, temperature}: {master: OllamaMaster; prompt: OllamaPrompt; format?: string | null; temperature?: number}): Promise<string> {
  const body: OllamaRequestBody = {
    model: master.model,
    system: prompt.system,
    prompt: prompt.user,
    stream: false,
    options: {
      num_ctx: master.contextSize ?? 4096,
      num_predict: master.numPredict ?? 400,
      repeat_penalty: master.repeatPenalty ?? 1.3,
      temperature: temperature ?? master.temperature ?? 0.85,
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

  const data = await response.json();
  return data.response;
}

// ---------- Passos isolados ----------

function validatePayload(payload: any): payload is ActionPayload {
  return Boolean(payload?.action && payload?.playerName);
}

function parseWorldField<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  }
  catch {
    return fallback;
  }
}

async function analyzeAction(master: OllamaMaster, action: string): Promise<ActionType> {
  const fallback: ActionType = {category: "OUTRO", object: "", objectType: "none"};

  if (master.system !== 'ollama') return fallback;

  try {
    const intentJsonStr = await callOllama({
      master,
      prompt: {
        system: `Você é um classificador de ações de RPG. Analise a ação do jogador e retorne APENAS um JSON.

CATEGORIAS (escolha exatamente uma):
- AÇÃO_SIMPLES: o jogador faz algo rotineiro, sem risco ou objeto novo envolvido (beber água, sentar, olhar ao redor, andar, descansar).
- AÇÃO_COMPLEXA: o jogador tenta algo arriscado ou que exige teste de habilidade, mas não é combate nem usa item (escalar um muro, arrombar uma porta, saltar um abismo).
- APRESENTAÇÃO: o jogador CHEGA a um lugar novo ou VÊ algo pela primeira vez que precisa ser descrito ao jogador.
- DESCRIÇÃO: o jogador PERGUNTA explicitamente sobre algo que já existe na cena.
- CONVERSA: o jogador fala com um NPC específico.
- COMBATE: o jogador ataca ou é atacado.
- USO_ITEM: o jogador usa um item do inventário ou do cenário com um propósito específico.
- PASSAGEM_DE_TEMPO: o jogador pula adiante no tempo.
- REGRA: o jogador pergunta sobre uma regra do jogo, não sobre a história.
- OUTRO: nenhuma das anteriores se aplica.

REGRA DE DESEMPATE: ações cotidianas sem risco (comer, beber água de uma fonte comum, andar) são sempre AÇÃO_SIMPLES, mesmo que mencionem um objeto. APRESENTAÇÃO só se aplica quando o jogador está DESCOBRINDO algo novo na cena.

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
      temperature: 0.15 // classificação precisa ser consistente, não criativa
    });

    const parsed = JSON.parse(intentJsonStr);
    const validTypes = ['monster', 'item', 'place', 'person', 'none'];
    if (!validTypes.includes(parsed.objectType)) parsed.objectType = 'none';

    return parsed;
  }
  catch (error) {
    console.error("Erro na classificação de intenção. Assumindo OUTRO.", error);
    return fallback;
  }
}

const ACTION_TYPES: Record<string, (acao: ActionType, world: any) => string> = {
  AÇÃO_SIMPLES: () =>
    `\nO jogador quer fazer algo simples. Continue a narração como consequência.`,
  AÇÃO_COMPLEXA: (a) =>
    `\nO jogador tenta algo arriscado com ${a.object || 'o ambiente'}. Peça uma rolagem de dados e narre o resultado.`,
  APRESENTAÇÃO: (a, world) =>
    `\nO jogador encontrou ${a.object}. Veja se tem isso no mundo: ${JSON.stringify(world.excerpt ?? world)}. Faça uma apresentação do que ele encontrou focando em mistérios.`,
  DESCRIÇÃO: (a, world) =>
    `\nO jogador quer saber sobre ${a.object}. Use: ${JSON.stringify(world.excerpt ?? world)} e responda a pergunta. Priorize os sentidos.`,
  CONVERSA: (a, world) =>
    `\nConversa com ${a.object}. Mantenha o tom do mundo baseado em: ${JSON.stringify(world.history)}. Narre a resposta do NPC.`,
  COMBATE: (a, world) =>
    `\nAtaque a: ${a.object || 'um inimigo'}. Calcule o resultado baseado em ${world.rules} e descreva o impacto de forma visceral. Se não tiver valores, peça para o jogador jogar o dado.`,
  USO_ITEM: (a) =>
    `\nInteração com: ${a.object}. Peça ao jogador que lance um dado. Depois descreva se obteve sucesso ou falhou misteriosamente.`,
  PASSAGEM_DE_TEMPO: () =>
    `\nAcelere a narrativa resumindo o tempo transcorrido.`,
  REGRA: (a, world) =>
    `\nResponda sobre a regra baseado em: ${world.rules}.`,
  OUTRO: () =>
    `\nVocê não entendeu a resposta. Peça para o jogador repetir.`,
};

function findWorldExcerpt(objectType: ActionType['objectType'], objectName: string, world: any): any {
  const searchIn = (list: any[] | undefined, nameFields: string[]) => {
    if (!list) return null;
    const target = objectName.toLowerCase();
    return list.find((item) => nameFields.some((f) => item[f]?.toLowerCase()?.includes(target))) || null;
  };

  switch (objectType) {
    case 'monster':
      return searchIn(world.monsters, ['tipo']) || world.monsters;
    case 'item':
      return searchIn(world.items, ['nome']) || null;
    case 'place':
      return searchIn(world.places, ['nome']) || world.places;
    case 'person':
      return searchIn(world.chars, ['nome']) || null;
    default:
      return null;
  }
}

function buildInstruction(actionAnalyzed: ActionType, world: any): string {
  const excerpt = findWorldExcerpt(actionAnalyzed.objectType, actionAnalyzed.object, world);
  const builder = ACTION_TYPES[actionAnalyzed.category];
  return builder ? builder(actionAnalyzed, {...world, excerpt}) : `\nApenas narre a reação do mundo à ação.`;
}

function buildHistoryByBudget(log: {sender: string; charName: string | null; text: string}[], charBudget: number = 2000): string {
  const entries: string[] = [];
  let usedChars = 0;

  for (let i = log.length - 1; i >= 0; i--) {
    const entry = log[i];
    const line = `${entry.charName ?? entry.sender}: ${entry.text}`;
    if (usedChars + line.length > charBudget) break;
    entries.unshift(line);
    usedChars += line.length;
  }

  return entries.join('\n') || 'Nenhum histórico ainda.';
}

async function narrateConsequence({
  master, 
  world, 
  instruction, 
  charName, 
  action, 
  lastMasterLine
}: {master: OllamaMaster; world: any; instruction: string; charName: string | null; playerName: string; action: string; lastMasterLine: string}): Promise<string> {

  if (master.system !== 'ollama') {
    console.warn(`Master system "${master.system}" ainda não implementado.`);
    return "O Mestre configurado para esta sala ainda não está disponível.";
  }
  console.log(`Chamando o Mestre ${master.model} para narrar...`);

  const cabecalho = master.personality ? `${MASTER_HEADER}\n\nSua Personalidade: ${master.personality}.` : MASTER_HEADER;
  const quemAgiu = charName;

  try {
    return await callOllama({
      master,
      prompt: {
        system: `${cabecalho}
        Sua última narração (não repita as mesmas palavras/imagens): "${lastMasterLine}".
        ${instruction}.`,
        user: `${quemAgiu} declarou a ação: "${action}". Narre a consequência.`
      },
      format: null
    });
  }
  catch (error) {
    console.error("Erro ao chamar o Mestre Ollama:", error);
    return "O mestre observa em silêncio...";
  }
}

// ---------- GET: histórico da aventura ----------

export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;

    const [adventureRow] = await db.select().from(adventures).where(eq(adventures.roomId, roomId));
    if (!adventureRow) {
      return NextResponse.json({error: 'Aventura não encontrada.'}, {status: 404});
    }

    const log = await db
      .select({
        id: adventureLogs.id,
        sender: adventureLogs.sender,
        charId: adventureLogs.charId,
        charName: adventureLogs.charName,
        text: adventureLogs.text,
        sentAt: adventureLogs.sentAt,
      })
      .from(adventureLogs)
      .where(eq(adventureLogs.adveId, adventureRow.id))
      .orderBy(asc(adventureLogs.sentAt));

    return NextResponse.json({log});
  }
  catch (error) {
    console.error('Erro ao buscar histórico da aventura:', error);
    return NextResponse.json({error: 'Erro ao buscar histórico.'}, {status: 500});
  }
}

// ---------- POST: nova ação + narração ----------

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id: roomId} = await params;
    const payload = await request.json();

    if (!validatePayload(payload)) {
      return NextResponse.json({error: 'Ação ou nome do jogador inválido.'}, {status: 400});
    }

    const [roomRow] = await db.select().from(rooms).where(eq(rooms.id, roomId));
    if (!roomRow) {
      return NextResponse.json({error: 'Sala não encontrada.'}, {status: 404});
    }

    const [adventureRow] = await db.select().from(adventures).where(eq(adventures.roomId, roomId));
    if (!adventureRow) {
      return NextResponse.json({error: 'Aventura não encontrada.'}, {status: 404});
    }

    const [worldRow] = await db.select().from(worlds).where(eq(worlds.id, adventureRow.worldId));
    const [masterRow] = await db.select().from(masters).where(eq(masters.roomId, roomId));

    if (!masterRow) {
      return NextResponse.json({error: 'Sala sem Mestre (IA) configurado.'}, {status: 400});
    }

    // salva a ação do jogador
    await db.insert(adventureLogs).values({
      adveId: adventureRow.id,
      sender: payload.playerName,
      charId: payload.char?.id ?? null,
      charName: payload.char?.name ?? null,
      text: payload.action,
      sentAt: new Date(),
    });

    const world = {
      rules: worldRow.rules,
      history: parseWorldField(worldRow.history, {}),
      places: parseWorldField(worldRow.places, []),
      chars: parseWorldField(worldRow.chars, []),
      monsters: parseWorldField(worldRow.monsters, []),
      items: parseWorldField(worldRow.items, []),
    };

    const actionAnalyzed = await analyzeAction(masterRow, payload.action);
    console.log(actionAnalyzed)
    const instruction = buildInstruction(actionAnalyzed, world);
    console.log(instruction)

    const fullLog = await db
      .select({
        sender: adventureLogs.sender,
        charName: adventureLogs.charName,
        text: adventureLogs.text,
      })
      .from(adventureLogs)
      .where(eq(adventureLogs.adveId, adventureRow.id))
      .orderBy(asc(adventureLogs.sentAt));

    const lastMasterLine = [...fullLog].reverse().find((l) => l.sender === masterRow.model)?.text ?? 'Nenhuma narração anterior.';

    const aiResponseText = await narrateConsequence({
      master: masterRow,
      world,
      instruction,
      charName: payload.char?.name ?? null,
      playerName: payload.playerName,
      action: payload.action,
      lastMasterLine,
    });

    await db.insert(adventureLogs).values({
      adveId: adventureRow.id,
      sender: masterRow.model,
      charId: null,
      charName: 'Mestre',
      text: aiResponseText,
      sentAt: new Date(),
    });

    await db.update(rooms).set({lastActivityAt: new Date()}).where(eq(rooms.id, roomId));

    return NextResponse.json({success: true, masterResponse: aiResponseText});
  }
  catch (error) {
    console.error("ERRO NO BACKEND DA AVENTURA:", error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";

    if (errorMsg.includes('fetch failed') || errorMsg.includes('ECONNREFUSED')) {
      return NextResponse.json({error: 'Erro de Conexão', details: 'O servidor do Ollama não está rodando. Abra o Ollama no seu PC.'}, {status: 500});
    }

    return NextResponse.json({error: 'Erro ao invocar o Mestre', details: errorMsg}, {status: 500});
  }
}