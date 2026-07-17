import {callOllama, type OllamaMaster} from './ollamaClient';

const MASTER_HEADER = `Regras fixas de formato, sempre válidas:
- Nunca repita a mesma descrição sensorial (cheiros, sons, texturas) usada na sua resposta anterior; varie o vocabulário.
- Responda em no máximo 3 parágrafos curtos.
- Termine sempre com uma única pergunta objetiva ao jogador, nunca mais de uma.
- Nunca fale pelo jogador nem decida a ação dele; apenas narre a consequência do que ele fez.`;

export async function narrateConsequence({
  master, world, instruction, charName, playerName, action, lastMasterLine
}: {master: OllamaMaster; world: any; instruction: string; charName: string | null; playerName: string; action: string; lastMasterLine: string}): Promise<string> {
  if (master.system !== 'ollama') {
    console.warn(`Master system "${master.system}" ainda não implementado.`);
    return "O Mestre configurado para esta sala ainda não está disponível.";
  }

  const cabecalho = master.personality ? `${MASTER_HEADER}\n\nSua Personalidade: ${master.personality}.` : MASTER_HEADER;
  const quemAgiu = charName || playerName;

  try {
    return await callOllama({
      master,
      prompt: {
        system: `${cabecalho}

        Mundo: ${JSON.stringify(world.history)}.
        Regras: ${world.rules}.
        Sua última narração (não repita as mesmas palavras/imagens): "${lastMasterLine}".
        ${instruction}.`,
        user: `${quemAgiu} declarou a ação: "${action}". Narre a consequência.`
      },
      format: null
    });
  }
  catch (error) {
    console.error("Erro ao chamar o Mestre Ollama:", error);
    return "Erro ao chamar o Mestre Ollama";
  }
}