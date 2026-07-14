// arquivo: sala principal
// local: src\app\room\[id]\page.tsx

import {notFound} from 'next/navigation';
import {getRoomData} from '@/lib/getRoomData';
import RoomHeader from '@/components/RoomHeader';
import RoomChars from '@/components/RoomChars';
import RoomAdventure from '@/components/RoomAdventure';
import RoomChat from '@/components/RoomChat';

interface Props {
  params: Promise<{id: string}>;
}

export async function generateMetadata({params}: Props) {
  const {id} = await params;
  const roomDetails = await getRoomData(id);

  return {
    title: roomDetails ? `RPGMO: ${roomDetails.adventure.title}` : 'RPG: Sala não encontrada',
    description: 'Se divirta.',
  };
}

export default async function RoomPage({params}: Props) {
  const {id} = await params;
  const roomDetails = await getRoomData(id);

  if (!roomDetails) {
    notFound();
  }

  return (
    <div className='room'>
      <RoomHeader room={roomDetails.room} adventure={roomDetails.adventure} world={roomDetails.world}/>

      <main className="roomMain">
        <RoomChars roomId={id} adveId={roomDetails.adventure.id} characters={roomDetails.characters}/>
        <RoomAdventure roomId={id} characters={roomDetails.characters} master={roomDetails.master}/>
        <RoomChat roomId={id}/>
      </main>
    </div>
  );
}