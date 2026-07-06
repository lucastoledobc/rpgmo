'use client';
import {use, useEffect, useState} from 'react';
import RoomHeader from '@/components/RoomHeader.js';
import RoomChars from '@/components/RoomChars.js';
import RoomAdventure from '@/components/RoomAdventure.js';
import RoomChat from '@/components/RoomChat.js';

export default function RoomPage({params}: {params: Promise<{id: string}>}) {
  const {id} = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/room/${id}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Carregando sala...</div>;

  return (
    <div className='room'>
      <RoomHeader roomInfo={data.room}/>

      {/* Conteúdo Principal */}
      <main className="roomMain">

        {/* Coluna 1: Personagens */}
          <RoomChars roomId={id} chars={data.chars}/>

        {/* Coluna 2: Mestre IA */}
          <RoomAdventure  roomId={id} roomData={data}/>

        {/* Coluna 3: Chat Amigos */}
          <RoomChat roomId={id}/>
      </main>
    </div>
  );
}