// arquivo: seleciona o tipo da ação do jogador
// local: src\lib\master\classifyAction.ts

import {callOllama} from './masterOllama';
import {callGemini} from './masterGemini';

export interface ActionType {
  category: string;
  object: string;
  objectType: 'rules' | 'place' | 'person' | 'monster' | 'item' | 'none';
}

const CLASSIFICATION_PROMPT = `Você é um classificador de ações de RPG. Analise a ação do jogador e retorne APENAS um JSON.

CATEGORIAS (escolha exatamente uma):
- AÇÃO_SIMPLES: o jogador faz algo rotineiro, sem risco ou objeto novo envolvido (beber água, sentar, olhar ao redor, andar, descansar).
- AÇÃO_COMPLEXA: o jogador tenta algo arriscado ou que exige teste de habilidade, mas não é combate nem usa item (escalar um muro, arrombar uma porta, saltar um abismo).
- APRESENTAÇÃO: o jogador CHEGA a um lugar novo ou VÊ algo pela primeira vez que precisa ser descrito ao jogador.
- DESCRIÇÃO: o jogador PERGUNTA explicitamente sobre algo que já existe na cena.
- CONVERSA: o jogador fala com um NPC específico.
- COMBATE: o jogador ataca ou é atacado.
- USO_ITEM: o jogador usa um item do inventário ou do cenário com um propósito específico.
- PASSAGEM_DE_TEMPO: o jogador pula adiante no tempo.
- REGRA: o jogador pergunta sobre uma regra do jogo, não sobre a história.
- OUTRO: nenhuma das anteriores se aplica.

REGRA DE DESEMPATE: ações cotidianas sem risco (comer, beber água de uma fonte comum, andar) são sempre AÇÃO_SIMPLES, mesmo que mencionem um objeto. APRESENTAÇÃO só se aplica quando o jogador está DESCOBRINDO algo novo na cena.

Exemplos:
Ação: "quero beber água" -> {"category": "AÇÃO_SIMPLES", "object": "água", "objectType": "none"}
Ação: "bebo a poção vermelha do meu inventário" -> {"category": "USO_ITEM", "object": "poção vermelha", "objectType": "item"}
Ação: "entro na caverna escura" -> {"category": "APRESENTAÇÃO", "object": "caverna escura", "objectType": "place"}
Ação: "o que é aquela estátua?" -> {"category": "DESCRIÇÃO", "object": "estátua", "objectType": "none"}
Ação: "ataco o goblin" -> {"category": "COMBATE", "object": "goblin", "objectType": "monster"}
Ação: "quero dormir" -> {"category": "PASSAGEM_DE_TEMPO", "object": "", "objectType": "none"}

Retorne EXCLUSIVAMENTE o JSON, sem texto adicional, com as chaves "category" (string), "object" (string), "objectType" (string: rules|place|person|monster|item|none).`;

export async function classifyAction(master: any, action: string): Promise<ActionType> {
  const fallback: ActionType = {category: "OUTRO", object: "", objectType: "none"};

  if (master.system === 'ollama') {
    master.repeatPenalty = 1;
    master.temperature = 0.1;
    try {
      const intentJsonStr = await callOllama({
        master,
        prompt: {
          system: CLASSIFICATION_PROMPT,
          user: `Ação: "${action}"`
        },
        format: "json",
      });

      const parsed = JSON.parse(intentJsonStr);
      const validTypes = ['rules','place','person','monster','item','none'];
      if (!validTypes.includes(parsed.objectType)) parsed.objectType = 'none';

      if (parsed.category === 'CONVERSA' && parsed.object === '') {parsed.category = 'OUTRO';}

      return parsed;
    }
    catch (error) {
      console.error("Erro na classificação de intenção. Assumindo OUTRO.", error);
      return fallback;
    }
  }
  if (master.system === 'gemini') {
    master.temperature = 0.1;
    try {
      const intentJsonStr = await callGemini({
        master,
        prompt: {
          system: CLASSIFICATION_PROMPT,
          user: `Ação: "${action}"`
        },
        format: {
          type: "object",
          properties: {
            category: {type: "string"},
            object: {type: "string"},
            objectType: {type: "string"},
          }
        }
      });

      const parsed = JSON.parse(intentJsonStr);
      const validTypes = ['rules','place','person','monster','item','none'];
      if (!validTypes.includes(parsed.objectType)) parsed.objectType = 'none';

      if (parsed.category === 'CONVERSA' && parsed.object === '') {parsed.category = 'OUTRO';}

      return parsed;
    }
    catch (error) {
      console.error("Erro na classificação de intenção. Assumindo OUTRO.", error);
      return fallback;
    }
  }
  else {
    console.warn(`Master system "${master.system}" ainda não implementado. Assumindo OUTRO.`);
    return fallback;
  }
}