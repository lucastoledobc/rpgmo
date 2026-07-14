// arquivo: gerador de id de personagem
// local: src\lib\generateCharId.ts

import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {characters} from '@/db/schema';

// Gera um id aleatório de 12 caracteres, garantindo unicidade contra o banco.
export async function generateCharId(): Promise<string> {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  let disponivel = false;

  while (!disponivel) {
    id = Array.from({length: 12}, () => charset[Math.floor(Math.random() * 36)]).join('');
    const [existente] = await db.select().from(characters).where(eq(characters.id, id));
    if (!existente) disponivel = true;
  }

  return id;
}