// arquivo: envia a instrução final para o mestre e recebe a narração
// local: src\lib\master\narrate.ts

import {callOllama, callOllamaChat, callOllamaImg} from './masterOllama';
import {callGemini, callGeminiChat, callGeminiDoc, callGeminiImg} from './masterGemini';
import {callGroq} from './masterGroq';
import {callMistral} from './masterMistral';
import type {ChatMessage} from '@/types/master';
import type {Master} from '@/types/campaign';
import { error } from 'node:console';

export async function narrate({type, master, chatHistory, instruction, format, interactionId}: {type: string, master: Master, chatHistory: ChatMessage[], instruction?: string, format?: object, interactionId?: string}): Promise<{text: string; interactionId?: string; error?: boolean}> {
  let res;
  try {
    if (master.system === 'ollama' || master.system === 'ollamaL') {
      if (type === 'text') {
        res = await callOllama({
          master: master,
          systemPrompt: instruction ?? '',
          message: chatHistory[0],
          format: format,
        });
      }
      if (type === 'chat') {
        res = await callOllamaChat({
          master: master,
          systemPrompt: instruction ?? '',
          messages: chatHistory,
        });
      }
      else if (type === 'img') {
        res = await callOllamaImg({
          master: master,
          prompt: chatHistory[-1].text,
          format: format ? format : null,
        });
      }
    }
    else if (master.system === 'gemini') {
      if (type === 'text') {
        res = await callGemini({
          master: master,
          systemPrompt: instruction ?? '',
          messages: chatHistory,
          format: format,
        });
      }
      else if (type === 'chat') {
        let lastMessage = chatHistory.at(-1);
        if (lastMessage){
        res = await callGeminiChat({
          master: master,
          systemPrompt: instruction ?? undefined,
          message: lastMessage,
          previousInteractionId: interactionId ?? undefined,
        });}
      }
      else if (type === 'img') {
        res = await callGeminiImg({
          master: master,
          prompt: chatHistory[0].text,
          format: format ? format : null,
        });
      }
    }
    else if (master.system === 'groq') {
      if (type === 'text' || type === 'chat') {
        res = await callGroq({
          master: master,
          systemPrompt: instruction ?? '',
          messages: chatHistory,
          format: format,
        });
      }
    }
    else if (master.system === 'mistral') {
      if (type === 'text' || type === 'chat') {
        res = await callMistral({
          master: master,
          systemPrompt: instruction ?? '',
          messages: chatHistory,
          format: format,
        });
      }
    }
    else {
      res = {text: `Sistema "${master.system}" ainda não implementado.`, error: true};
    }
    if (!res) {res = {text: `Sistema ${master.system} não impementado para o tipo ${type}.`, error: true}}
  }
  catch(error) {
    res = {text: `Error narrate: ${error}`, interactionId: interactionId ?? undefined, error: true}
  }
  return res;
}