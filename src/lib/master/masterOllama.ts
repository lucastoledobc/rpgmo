// arquivo: chamada para Ollama
// local: src\lib\master\masterOllama.ts

import {Ollama} from "ollama";
import type {ChatMessage} from '@/types/master';
import type {Master} from '@/types/campaign';


// Chama Ollama generate
export async function callOllamaLocal({master, systemPrompt, message, format, repeatPenalty, temperature}: {master: Master; systemPrompt: string; message: ChatMessage; format: object | null; repeatPenalty?: number | null; temperature?: number | null}): Promise<{text: string}> {
  const body = {
    model: master.model,
    system: systemPrompt,
    prompt: message.text,
    format: format ?? null,
    stream: false,
    options: {
      num_ctx: master.contextSize ?? 4096,
      num_predict: master.numPredict ?? 400,
      temperature: temperature ?? master.temperature ?? 0.7,
      repeat_penalty: repeatPenalty ?? master.repeatPenalty ?? 1.3,
    }
  };

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Erro na API do Ollama: ${response.statusText}`);
  }

  const data = await response.json();
  return {text: data.response};
}

// Chama Ollama chat (salva seção por 5 min)
export async function callOllamaLocalChat({master, systemPrompt, messages}: {master: Master; systemPrompt: string; messages: ChatMessage[]}): Promise<{text: string}> {
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
    fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    }).catch(err => console.error("Erro no aquecimento:", err));
    
    return {text: ''};
  }

  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Erro na API do Ollama: ${response.statusText}`);
  }

  const data = await response.json();
  return {text: data.message?.content ?? 'Ollama não gerou texto.'};
}


// Chama Ollama generate Img
export async function callOllamaLocalImg({master, prompt, format}: {master: Master; prompt: string; format: any;}): Promise<{text: string}> {
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
  
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Erro na API do Ollama: ${response.statusText}`);
  }

  const data = await response.json();
  return {text: data?.image ?? 'Ollama não gerou imagem.'};
}


// Chama Ollama generate
export async function callOllamaOnline({master, systemPrompt, message, format, repeatPenalty, temperature}: {master: Master; systemPrompt: string; message: ChatMessage; format: object | null; repeatPenalty?: number | null; temperature?: number | null}): Promise<{text: string}> {
  
  const ollama = new Ollama({
    host: 'https://ollama.com',
    headers: {Authorization: 'Bearer ' + master.apiKey},
  });

  try {
    const response = await ollama.generate({
      model: master.model ?? '',
      system: systemPrompt,
      prompt: message.text,
      stream: false,
      keep_alive: '10m',
      options: {
        num_ctx: master.contextSize ?? 4096,
        num_predict: master.numPredict ?? 300,
        temperature: master.temperature ?? 0.9,
        repeat_penalty: master.repeatPenalty ?? 1.1,
      },
    });

    return {text: response.response ?? 'Ollama não gerou texto.'};
  }
  catch (error) {
    throw new Error(`Erro na API do Ollama: ${error}`);
  }
}

// Chama Ollama chat
export async function callOllamaChatOnline({master, systemPrompt, messages}: {master: Master; systemPrompt: string; messages: ChatMessage[]}): Promise<{text: string}> {
  
  const ollama = new Ollama({
    host: 'https://ollama.com',
    headers: {Authorization: 'Bearer ' + master.apiKey},
  });

  try {
    const response = await ollama.chat({
      model: master.model ?? '',
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
    });

    return {text: response.message?.content ?? 'Ollama não gerou texto.'};
  }
  catch (error) {
    throw new Error(`Erro na API do Ollama: ${error}`);
  }
}