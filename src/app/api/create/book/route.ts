import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const bookData = await request.json();
    
    // Sanitização simples para evitar caminhos maliciosos
    const filename = bookData.name.replace(/\s+/g, '') + '.json';
    const filePath = path.join(process.cwd(), 'src', 'data', 'livros', filename);

    // Salva o arquivo na pasta de livros
    await fs.writeFile(filePath, JSON.stringify(bookData, null, 2));

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar livro' }, { status: 500 });
  }
}