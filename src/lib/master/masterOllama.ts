// arquivo: chamada para Ollama
// local: src\lib\master\masterOllama.ts

import type {ChatMessage} from '@/types/master';
import type {Master} from '@/types/campaign';

function resolveOllamaBaseUrl(master: Master): string {
  const url = master.url?.trim();
  if (!url) {
    throw new Error('URL do Ollama não configurada. Configure o túnel ou selecione o modo Cloud nas configurações do Mestre.');
  }
  return url.replace(/\/$/, ''); // remove barra final, se houver, pra evitar "//api/generate"
}

// Monta os headers da requisição: local/online
function buildOllamaHeaders(baseUrl: string, master: Master): Record<string, string> {
  const headers: Record<string, string> = {'Content-Type': 'application/json'};

  if (baseUrl.includes('ollama.com')) {
    if (!master?.apiKey) {throw new Error("ApiKey incorreta.");}
    headers['Authorization'] = `Bearer ${master.apiKey}`;
  }

  return headers;
}

// Chama Ollama generate (interação única, sem histórico)
export async function callOllama({master, systemPrompt, message, format, repeatPenalty, temperature}: {master: Master; systemPrompt: string; message: ChatMessage; format?: object; repeatPenalty?: number | null; temperature?: number | null}): Promise<{text: string}> {
  const baseUrl = resolveOllamaBaseUrl(master);
  const headers = buildOllamaHeaders(baseUrl, master);

  const body = {
    model: master.model,
    system: systemPrompt,
    prompt: message.text,
    format: format,
    stream: false,
    options: {
      num_ctx: master.contextSize ?? 4096,
      num_predict: master.numPredict ?? 400,
      temperature: temperature ?? master.temperature ?? 0.7,
      repeat_penalty: repeatPenalty ?? master.repeatPenalty ?? 1.3,
    }
  };

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Erro na API do Ollama: ${response.statusText}`);
  }

  const data = await response.json();
  return {text: data.response};
}

// Chama Ollama chat (com histórico)
export async function callOllamaChat({master, systemPrompt, messages}: {master: Master; systemPrompt: string; messages: ChatMessage[]}): Promise<{text: string}> {
  const baseUrl = resolveOllamaBaseUrl(master);
  const headers = buildOllamaHeaders(baseUrl, master);

  const body = {
    model: master.model,
    messages: [
      {role: 'system', content: systemPrompt},
      ...messages.map((m) => ({role: m.type === 'player' ? 'user' : 'assistant', content: m.text})),
    ],
    stream: false,
    keep_alive: '10m',
    options: {
      num_ctx: master.contextSize ?? 4096,
      num_predict: master.numPredict ?? 300,
      temperature: master.temperature ?? 0.9,
      repeat_penalty: master.repeatPenalty ?? 1.1,
    },
  };

  // Warmup: É o aquecimento (Nenhuma mensagem do jogador ainda)
  if (messages.length === 0) {
    // Dispara em segundo plano, SEM usar o 'await' para não travar o jogo
    fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }).catch(err => console.error("Erro no aquecimento:", err));

    return {text: ''};
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Erro na API do Ollama: ${response.statusText}`);
  }

  const data = await response.json();
  return {text: data.message?.content ?? 'Ollama não gerou texto.'};
}

// Chama Ollama generate Img
export async function callOllamaImg({master, prompt, format}: {master: Master; prompt: string; format: any;}): Promise<{text: string}> {
  const baseUrl = resolveOllamaBaseUrl(master);
  const headers = buildOllamaHeaders(baseUrl, master);

  const body = {
    model: master.model,
    prompt: prompt,
    stream: false,
    width: format.width,
    height: format.height,
    options: {
      num_ctx: master.contextSize ?? 4096,
      num_predict: master.numPredict ?? 400,
      temperature: master.temperature ?? 0.7,
      repeat_penalty: master.repeatPenalty ?? 1.3,
    }
  }

  let response;

  try {
    response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    if (!data?.image) {
      throw new Error('Ollama não gerou imagem.');
    }
    
    return {text: data.image};
  }
  catch (error) {
    console.error('Erro detalhado: ', error);
    throw new Error(`Erro na API do Ollama: ${error}`);
  }
}