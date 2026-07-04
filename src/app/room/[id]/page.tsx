'use client';
import {use, useEffect, useState} from 'react';
import RoomHeader from '@/components/RoomHeader.js';
import RoomPlayer from '@/components/RoomPlayer.js';
import RoomChatAI from '@/components/RoomChatAI.js';
import RoomChatF from '@/components/RoomChatF.js';

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
    <div>
      <RoomHeader roomInfo={data.info}/>

      {/* Conteúdo Principal */}
      <main className="layout">

        {/* Coluna 1: Personagens */}
          <RoomPlayer roomId={id} chars={data.chars}/>

        {/* Coluna 2: Mestre IA */}
          <RoomChatAI  roomId={id} mestreInfo={data}/>

        {/* Coluna 3: Chat Amigos */}
          <RoomChatF roomId={id}/>
      </main>
    </div>
  );
}