// arquivo: sala principal
// local: src\app\room\[id]\page.tsx

import {notFound} from 'next/navigation';
import {getCampaign} from '@/lib/getCampaign';
import Adventure from '@/components/Adventure';
import Header from '@/components/Header';

interface Props {
  params: Promise<{room: string}>;
}

export async function generateMetadata({params}: Props) {
  const {room} = await params;
  const campaign = await getCampaign(room);

  return {
    title: campaign ? `RPGMO: ${campaign.title}` : 'Sala não encontrada',
    description: 'Se divirta.',
  };
}

export default async function RoomPage({params}: Props) {
  const {room} = await params;
  const campaign = await getCampaign(room);

  if (!campaign) {
    notFound();
  }

  return (
    <div className='room'>
      <Header campaign={campaign}/>

      <main className="roomMain">
        <Adventure campaign={campaign}/>
      </main>
    </div>
  );
}