// arquivo: chamada para Gemini
// local: src\lib\master\masterGemini.ts

import {GoogleGenAI} from "@google/genai";

export interface GeminiMaster {
  system: string;
  model: string;
  apiKey: string;
  thinking_level: number | null;
  temperature: number | null;
  personality: string | null;
}

export interface GeminiPrompt {
  system: string;
  user: string;
}

interface GeminiRequestBody {
  model: string;
  input: string;
  system_instruction: string;
  response_format: string;
  stream: boolean;
  generationConfig: {
    thinking_level?: string;
    temperature?: number;
  };
}

const ai = new GoogleGenAI({})
export async function callGemini({master, prompt, format}: {master: GeminiMaster; prompt: GeminiPrompt; format: object | null;}): Promise<string> {
  let response;

  if (format) {
    response = await ai.interactions.create({
      model: master.model,
      input: `${prompt.system}. Jogador: ${prompt.user}`,
      stream: false,
      generation_config: {
        temperature: master?.temperature || 1,
      },
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: format
      },
    });
  }

  else {
    response = await ai.interactions.create({
      model: master.model,
      system_instruction: prompt.system,
      input: prompt.user,
      stream: false,
      store: false,
      generation_config: {
        temperature: 1.0,
      },
    });
  }
  

  if (!response.ok) {
    throw new Error(`Erro na API do Gemini: ${response.status}`);
  }

  return response.steps.at(-1).content[0].text;
}
