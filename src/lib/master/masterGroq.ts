// arquivo: chamada para Groq
// local: src\lib\master\masterGroq.ts

import Groq from 'groq-sdk';
import type {ChatMessage} from '@/types/master';
import type {Master} from '@/types/campaign';

// Chama Groq 
export async function callGroq({master, systemPrompt, messages, format}: {master: Master; systemPrompt: string; messages: ChatMessage[]; format?: object}): Promise<{text: string}> {
  if (!master?.apiKey) {throw new Error("ApiKey incorreta.");}
  
  const ia = new Groq({apiKey: master.apiKey});

  try {
    const completion = await ia.chat.completions.create({
      model: master.model ?? '',
      messages: [
        {role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: (m.type === 'player' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.text,
        })),
      ],
      temperature: master.temperature ?? 0.9,
      max_completion_tokens: master.numPredict ?? 300,
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('Pedido enviado mas o texto não foi gerado.');
    }

    return {text: completion.choices[0].message.content};
  }
  catch (error) {
    throw new Error(`Erro na API do Groq: ${error}`);
  }
}