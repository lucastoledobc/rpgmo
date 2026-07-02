import {NextResponse} from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  const { id, senha } = await request.json();
  const filePath = path.join(process.cwd(), 'src', 'data', 'rooms', `${id}.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const roomData = JSON.parse(fileContent);

    if (roomData.senha !== senha) {
      return NextResponse.json({ error: 'Senha incorreta.' }, {status: 401});
    }

    return NextResponse.json({success: true});
  }
  catch (e) {
    return NextResponse.json({error: 'Sala não encontrada.'}, {status: 404});
  }
}