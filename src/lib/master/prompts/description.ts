

export function description(object: string, char: any, history: string, world: any): string {
  return `\nO ${char.name} encontrou ${object}. Veja se tem isso no mundo: ${JSON.stringify(world.excerpt ?? world)}. Descreva-o focando nos sentidos básicos.`;
}