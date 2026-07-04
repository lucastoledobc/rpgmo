import Master from '@/components/Master.js';
import {use} from 'react';

export const metadata = {
  title: 'Configure o Mestre',
  description: 'Criar uma sala de RPG.',
};

export default function ConfigMaster({params}: {params: Promise<{id: string}>}) {
  const {id} = use(params);
  return (
    <section>
      <Master roomId={id} />
    </section>
  );
}