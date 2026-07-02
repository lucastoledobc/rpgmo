import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// O Next.js 15 exige que os params sejam await
export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  // Precisamos fazer o await de params para acessar o id
  const { id } = await params;
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${id}.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(fileContent));
  } catch (e) {
    return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 });
  }
}