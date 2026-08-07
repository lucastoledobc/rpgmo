// arquivo: envia a instrução final para o mestre e recebe a narração
// local: src\lib\master\narrate.ts

import {callOllamaLocal, callOllamaLocalChat, callOllamaLocalImg, callOllamaOnline, callOllamaChatOnline} from './masterOllama';
import {callGemini, callGeminiChat, callGeminiDoc, callGeminiImg} from './masterGemini';
import type {ChatMessage} from '@/types/adventure';
import type {Master} from '@/types/room';

export async function narrate({type, master, chatHistory, instruction, format, interactionId}: {type: string, master: Master, chatHistory: ChatMessage[], instruction?: string, format?: object, interactionId?: string}): Promise<{text: string; interactionId?: string}> {
  if (type == 'chat') {
    switch (master.system) {
      case 'gemini':
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

      case 'ollamaLocal':
        try {
          const res = await callOllamaLocalChat({
            master: master,
            systemPrompt: instruction ?? '',
            messages: chatHistory,
          });
          return {text: res.text}
        }
        catch (error) {
          return {text: "Erro ao chamar o Mestre Ollama"};
        }

      case 'ollamaOnline':
        try {
          const res = await callOllamaChatOnline({
            master: master,
            systemPrompt: instruction ?? '',
            messages: chatHistory,
          });
          return {text: res.text}
        }
        catch (error) {
          return {text: "Erro ao chamar o Mestre Ollama"};
        }
        default:
          return {text: `Master system "${master.system}" ainda não implementado.`};
    }
  }
  else {
    switch (master.system) {
      case 'gemini':
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
      
      case 'ollamaLocal':
        try {
          const res = await callOllamaLocal({
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
      case 'ollamaOnline':
        try {
        const res = await callOllamaOnline({
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
      
      default:
        return {text: `Master system "${master.system}" ainda não implementado.`};
    }
  }
}