'use client';
import {use} from 'react'; // Importe o hook use do React
import Room from '@/components/Room.js';

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  // Desembrulha a Promise dos params
  const { id } = use(params);  
  return <Room roomId={id} />;
}