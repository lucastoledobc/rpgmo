// arquivo: envia a instrução final para o mestre e recebe a narração
// local: src\lib\master\narrate.ts

import {callOllamaLocal, callOllamaLocalChat, callOllamaLocalImg, callOllamaOnline, callOllamaChatOnline} from './masterOllama';
import {callGemini, callGeminiChat, callGeminiDoc, callGeminiImg} from './masterGemini';
import type {ChatMessage} from '@/types/master';
import type {Master} from '@/types/campaign';

export async function narrate({type, master, chatHistory, instruction, format, interactionId}: {type: string, master: Master, chatHistory: ChatMessage[], instruction?: string, format?: object, interactionId?: string}): Promise<{text: string; interactionId?: string; error?: boolean}> {
  switch (type) {
    case 'img': {
      switch (master.system) {
        case 'gemini':
          try {
            const res = await callGeminiImg({
              master: master,
              prompt: chatHistory[0].text,
              format: format ? format : null,
            });
            return {text: res.text}
          }
          catch (error) {
            return {text: "Erro ao chamar o Mestre Gemini img", error: true};
          }

        case 'ollamaLocal':
          try {
            const res = await callOllamaLocalImg({
              master: master,
              prompt: chatHistory[0].text,
              format: format ? format : null,
            });
            return {text: res.text}
          }
          catch (error) {
            return {text: "Erro ao chamar o Mestre Ollama img", error: true};
          }
          
        default:
          return {text: `Master system "${master.system}" ainda não implementado.`, error: true};
      }
    }

    case 'chat': {
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
          return {text: "Erro ao chamar o Mestre Gemini interaction", error: true};
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
            return {text: "Erro ao chamar o Mestre Ollama Local chat", error: true};
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
            return {text: "Erro ao chamar o Mestre Ollama chat", error: true};
          }
        default:
          return {text: `Master system "${master.system}" ainda não implementado.`, error: true};
      }
    }

    default: {
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
            return {text: "Erro ao chamar o Mestre Gemini generate", error: true};
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
            return {text: "Erro ao chamar o Mestre Ollama Local generate", error: true};
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
            return {text: "Erro ao chamar o Mestre Ollama generate", error: true};
          }
        
        default:
          return {text: `Master system "${master.system}" ainda não implementado.`, error: true};
      }
    }
  }
}