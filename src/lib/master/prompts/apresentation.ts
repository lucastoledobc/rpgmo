

export function apresentation(object: string, char: any, history: string, world: any): string {
  return `\nO jogador encontrou ${object}. Veja se tem isso no mundo: ${JSON.stringify(world.excerpt ?? world)}. Faça uma apresentação do que ele encontrou focando em mistérios.`;
}