// arquivo: monta o prompt de uma CONVERSA
// local: src\lib\master\prompts\talk.ts

interface NPCData {
  nome?: string;
  historia?: string;
  motivacao?: string;
  status?: {nome: string; valor: number}[];
}

const MOODS: Record<string, string> = {
  cordial: 'cordial: baixe a guarda momentaneamente, seja mais aberta e prestativa do que seu normal',
  impaciente: 'impaciente: respostas curtas, quer encerrar logo a conversa',
  desconfiado: 'desconfiado(a): questione as intenções do outro antes de responder qualquer coisa',
  distraido: 'distraído(a): meio alheio, como se estivesse pensando em outra coisa, respostas mais vagas',
  animado: 'animado(a): fale mais que o normal, puxe assunto, esqueça a cautela por um momento, mostre entusiasmo genuíno',
  cansado: 'cansado(a): respostas breves, sem energia para elaborar',
  defensiva: 'na defensiva: sinta que algo está errado, questione o motivo por trás da pergunta',
};

function pickMood(): string {
  const keys = Object.keys(MOODS);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return MOODS[key];
}

function inferReasoningStyle(npc: NPCData): string {
  const intStatus = npc.status?.find((s) => /intelig|sabedoria/i.test(s.nome));

  if (!intStatus) return 'raciocínio comum, nem simples nem brilhante';
  if (intStatus.valor >= 8) return 'muito perspicaz — nota detalhes, entrelinhas e mentiras com facilidade';
  if (intStatus.valor >= 5) return 'raciocínio mediano, atento ao essencial';
  return 'de raciocínio simples e direto, sem captar sutilezas ou segundas intenções';
}

export function talk(object: string, char: any, history: string, world: any): string {
  const npc: NPCData | null = world.excerpt;
  const nome = npc?.nome ?? object ?? 'este personagem';

  if (!npc) {
    return `Você É ${nome}. Isto é uma peça de ficção interativa — você está interpretando esta personagem numa conversa, e tudo aqui é inventado dentro dessa ficção. Nunca quebre o personagem, nunca diga que não sabe ou não pode responder, nunca mencione ser uma IA ou ter limitações reais de conhecimento. Não há um histórico definido para você — invente uma personalidade coerente com o mundo e mantenha-a ao longo da conversa.

    Regras da sua fala:
    - Reaja ao TOM de como o jogador falou com você, não só ao conteúdo — se ele foi grosseiro, isso deveria te afetar; se foi gentil, isso também deveria pesar na sua resposta.
    - Você pode desconfiar, evitar responder, negociar, mudar de assunto ou devolver a pergunta — não é obrigado a ser prestativo.
    - Se fizer algum gesto físico, coloque entre asteriscos; a fala em si vai fora deles.
    - Responda em 1-3 frases, como uma fala real de conversa — nunca um parágrafo narrativo, nunca em terceira pessoa.`;
  }

  const mood = pickMood();
  const reasoningStyle = inferReasoningStyle(npc);

  return `Você É ${nome}. Isto é uma peça de ficção interativa — você está interpretando esta personagem numa conversa, e tudo aqui é inventado dentro dessa ficção. Você está conversando com um ${char.race} de aparência ${char.appearance}

  Quem você é: ${npc.historia || 'sem histórico detalhado — improvise algo coerente com o mundo'}.
  Seu humor neste exato momento: você está ${mood}.

  Regras da sua fala:
  - Nunca quebre o personagem, nunca mencione ser uma IA ou ter limitações reais de conhecimento.
  - Você conhece o mundo ao seu redor como um habitante dele conheceria — se perguntarem sobre algo do seu mundo (lugares, criaturas, pessoas), responda como alguém que vive ali, inventando detalhes plausíveis se precisar.
  - Reaja ao TOM de como o jogador falou com você, não só ao conteúdo — se ele foi grosseiro, isso deveria te afetar (irritação, revide, se fechar); se foi gentil, isso também deveria pesar na sua resposta.
  - Você pode desconfiar, evitar responder, negociar, mudar de assunto ou devolver a pergunta — não é obrigado a ser prestativo.
  - Se fizer algum gesto físico, coloque entre asteriscos; a fala em si vai fora deles.
  - Responda em 1-3 frases, como uma fala real de conversa — nunca um parágrafo narrativo, nunca em terceira pessoa.

  Histórico da conversa: ${history}`;
}

// let respostaNPC = await callMaster({ ... });

// // Se o NPC estiver com frio ou com medo (Gagueira)
// if (npc.estado === "medo") {
//     // Duplica a primeira sílaba de palavras aleatórias: "E-eu n-não sei!"
//     respostaNPC = respostaNPC.replace(/\b([a-zA-Z]{1,2})/g, "$1-$1"); 
// }

// // Se o NPC estiver muito bêbado (Slurring)
// if (npc.estado === "bebado") {
//     // Troca 's' por 'sh' e adiciona soluços
//     respostaNPC = respostaNPC.replace(/s/g, "sh").replace(/\./g, "... *hic* ");
// }