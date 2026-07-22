// arquivo: chamada para Ollama
// local: src\lib\master\masterOllama.ts

export interface OllamaMaster {
  system: string;
  model: string;
  contextSize: number | null;
  numPredict: number | null;
  repeatPenalty: number | null;
  temperature: number | null;
  personality: string | null;
}

export interface OllamaPrompt {
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

export async function callOllama({master, prompt, format}: {master: OllamaMaster; prompt: OllamaPrompt; format: string | null;}): Promise<string> {
  const body: OllamaRequestBody = {
    model: master.model,
    system: prompt.system,
    prompt: prompt.user,
    stream: false,
    options: {
      num_ctx: master.contextSize ?? 4096,
      num_predict: master.numPredict ?? 400,
      repeat_penalty: master.repeatPenalty ?? 1.3,
      temperature: master.temperature ?? 0.7,
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