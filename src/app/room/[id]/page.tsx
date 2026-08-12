// arquivo: sala principal
// local: src\app\room\[id]\page.tsx

import {notFound} from 'next/navigation';
import {getCampaign} from '@/lib/getCampaign';
import RoomHeader from '@/components/RoomHeader';
import RoomChars from '@/components/RoomChars';
import RoomInAdventure from '@/components/Adventure';
import RoomOutAdventure from '@/components/RoomOutAdventure';
import RoomChat from '@/components/RoomChat';
import RoomLog from '@/components/RoomLog';

interface Props {
  params: Promise<{room: string}>;
}

export async function generateMetadata({params}: Props) {
  const {room} = await params;
  const campaign = await getCampaign(room);

  return {
    title: campaign ? `RPGMO: ${campaign.data?.title}` : 'Sala não encontrada',
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
      <RoomHeader campaign={campaign}/>

      <main className="roomMain">
        {/* <RoomChars roomId={id} adveId={roomDetails.adventure.id} characters={roomDetails.characters}/> */}
        <RoomInAdventure campaign={campaign}/>
        {/* <RoomOutAdventure roomId={id} characters={roomDetails.characters}/> */}
        {/* <RoomChars roomId={id} adveId={roomDetails.adventure.id} characters={roomDetails.characters}/> */}
        {/* <RoomLog roomId={id}/> */}
      </main>
    </div>
  );
}