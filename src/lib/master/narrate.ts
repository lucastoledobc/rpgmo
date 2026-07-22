// arquivo: envia a instrução final para o mestre e recebe a narração
// local: src\lib\master\narrate.ts

import {callOllama, type OllamaMaster} from './masterOllama';
import {callGemini, type GeminiMaster} from './masterGemini';

export async function narrate(master: any, instruction: string, action: string): Promise<string> {
  if (master.system === 'ollama') {
    try {
      return await callOllama({
        master: master as OllamaMaster,
        prompt: {system: instruction, user: action},
        format: null
      });
    }
    catch (error) {
      console.error("Erro ao chamar o Mestre Ollama:", error);
      return "Erro ao chamar o Mestre Ollama";
    }
  }

  if (master.system === 'gemini') {
    try {
      return await callGemini({
        master: master as GeminiMaster,
        prompt: {system: instruction, user: action},
        format: null
      });
    }
    catch (error) {
      console.error("Erro ao chamar o Mestre Gemini:", error);
      return "Erro ao chamar o Mestre Gemini";
    }
  }

  console.warn(`Master system "${master.system}" ainda não implementado.`);
  return "O Mestre configurado para esta sala ainda não está disponível.";
}