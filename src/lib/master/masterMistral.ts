// arquivo: chamada para Mistral
// local: src\lib\master\masterMistral.ts

import {Mistral} from '@mistralai/mistralai';
import type {ChatMessage} from '@/types/master';
import type {Master} from '@/types/campaign';

// Chama Mistral. 
export async function callMistral({master, systemPrompt, messages, format}: {master: Master; systemPrompt: string; messages: ChatMessage[]; format?: object}): Promise<{text: string}> {
  if (!master?.apiKey) {throw new Error("ApiKey incorreta.");}

  const ia = new Mistral({apiKey: master.apiKey});

  try {
    const response = await ia.chat.complete({
      model: master.model ?? '',
      messages: [
        {role: 'system', content: systemPrompt},
        ...messages.map((m) => ({
          role: (m.type === 'player' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.text,
        })),
      ],
      temperature: master.temperature ?? 0.9,
      maxTokens: master.numPredict ?? 300,
    });
    
    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Pedido enviado mas o texto não foi gerado.');
    }

    const content = response.choices?.[0]?.message?.content;
    const text = typeof content === 'string' ? content : '';

    return {text};
  }
  catch (error) {
    throw new Error(`Erro na API do Mistral: ${error}`);
  }
}