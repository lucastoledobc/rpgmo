// arquivo: sala principal
// local: src\app\room\[id]\page.tsx

import {notFound} from 'next/navigation';
import {getCampaign} from '@/lib/getCampaign';
import RoomAdventure from '@/components/RoomAdventure';
import RoomChars from '@/components/RoomChars';
import RoomHeader from '@/components/RoomHeader';
import RoomStatus from '@/components/RoomStatus';

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

  const isConfigured = Boolean(campaign.master?.system) && Boolean(campaign.world);

  return (
    <div className='room'>
      <RoomHeader campaign={campaign}/>
      <RoomStatus campaign={campaign}/>

      <main className="roomMain">
        <RoomAdventure campaign={campaign} disabled={!isConfigured}/>
        <RoomChars campaign={campaign}/>
      </main>
    </div>
  );
}