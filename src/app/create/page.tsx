// arquivo: página de criação de sala
// local: src\app\create\page.tsx

import Create from '@/components/Create';

export const metadata = {
  title: 'Criar Sala RPGMO',
  description: 'Criar uma sala de RPG.',
};

export default function CreatePage() {
  return (
      <Create />
  );
}