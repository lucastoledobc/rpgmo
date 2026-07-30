// arquivo: envia a instrução final para o mestre e recebe a narração
// local: src\lib\master\narrate.ts

import {callOllama, callOllamaChat, callOllamaImg} from './masterOllama';
import {callGemini, callGeminiChat, callGeminiDoc, callGeminiImg} from './masterGemini';
import {Master, ChatMessage} from '@/types/master';

export async function narrate({type, master, chatHistory, instruction, format, interactionId}: {type: string, master: Master, chatHistory: ChatMessage[], instruction?: string, format?: object, interactionId?: string}): Promise<{text: string; interactionId?: string}> {
  if (type == 'chat') {
    if (master.system === 'ollama') {
      try {
        const res = await callOllamaChat({
          master: master,
          systemPrompt: instruction ?? '',
          messages: chatHistory,
        });
        return {text: res.text}
      }
      catch (error) {
        return {text: "Erro ao chamar o Mestre Ollama"};
      }
    }

    if (master.system === 'gemini') {
      try {
        const res = await callGeminiChat({
          master: master,
          systemPrompt: instruction ?? undefined,
          message: chatHistory[0],
          previousInteractionId: interactionId ?? undefined,
        });
        return {text: res.text, interactionId: res.interactionId}
      }
      catch (error) {
        return {text: "Erro ao chamar o Mestre Gemini"};
      }
    }
    return {text: `Master system "${master.system}" ainda não implementado.`};
  }
  else {
    if (master.system === 'ollama') {
      try {
        const res = await callOllama({
          master: master,
          systemPrompt: instruction ?? '',
          message: chatHistory[0],
          format: format ? format : null,
        });
        return {text: res.text}
      }
      catch (error) {
        return {text: "Erro ao chamar o Mestre Ollama2"};
      }
    }

    if (master.system === 'gemini') {
      try {
        const res = await callGemini({
          master: master,
          systemPrompt: instruction ?? '',
          messages: chatHistory,
          format: format ? format : null,
        });
        return {text: res.text}
      }
      catch (error) {
        return {text: "Erro ao chamar o Mestre Gemini"};
      }
    }
    return {text: `Master system "${master.system}" ainda não implementado.`};
  }
}