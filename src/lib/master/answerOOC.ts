import {callOllama, type OllamaMaster} from './ollamaClient';

export async function answerOOC({
  master, world, question, history, charName, playerName
}: {master: OllamaMaster; world: any; question: string; history: string; charName: string | null; playerName: string}): Promise<string> {
  if (master.system !== 'ollama') {
    return "O Mestre configurado para esta sala ainda não está disponível.";
  }

  const quemPerguntou = charName ? `${charName} (jogado por ${playerName})` : playerName;

  try {
    return await callOllama({
      master,
      prompt: {
        system: `Você é o Mestre de RPG respondendo uma pergunta de BASTIDOR (fora do personagem, fora da narrativa).
        Não narre, não invente cena nova — responda de forma objetiva e factual, baseado no que já aconteceu na aventura.
        Se a pergunta depender de onde o personagem está ou o que ele especificamente sabe/vê, responda considerando a perspectiva de ${quemPerguntou}.
        Mundo: ${JSON.stringify(world.history)}.
        Regras: ${world.rules}.
        Histórico relevante da aventura:\n${history}`,
        user: `${quemPerguntou} pergunta (fora de cena): ${question}`
      },
      format: null,
      temperature: 0.3
    });
  }
  catch (error) {
    console.error("Erro ao responder pergunta OC:", error);
    return "O mestre não conseguiu processar sua pergunta agora.";
  }
}