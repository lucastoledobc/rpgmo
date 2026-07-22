// arquivo: chamada para Gemini (Interactions API)
// local: src\lib\master\masterGemini.ts

import {GoogleGenAI} from "@google/genai";

export interface GeminiMaster {
  system: string;
  model: string;
  apiKey: string;
  thinkingLevel: 'low' | 'medium' | 'high' | null;
  temperature: number | null;
  personality: string | null;
}

export interface GeminiPrompt {
  system: string;
  user: string;
}

export async function callGemini({master, prompt, format}: {master: GeminiMaster; prompt: GeminiPrompt; format: object | null;}): Promise<string> {
  const ai = new GoogleGenAI({apiKey: master.apiKey});

  try {
    const interaction = await ai.interactions.create({
      model: master.model,
      input: prompt.user,
      system_instruction: prompt.system,
      generation_config: {
        temperature: master.temperature ?? 1,
        ...(master.thinkingLevel ? {thinking_level: master.thinkingLevel} : {}),
      },
      ...(format ? {response_format: {type: "text", mime_type: "application/json", schema: format}} : {}),
      stream: false,
    });

    return interaction.output_text ?? '';
  }
  catch (error) {
    throw new Error(`Erro na API do Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
}