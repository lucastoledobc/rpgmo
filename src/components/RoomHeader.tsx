// arquivo: componente do header da sala
// local: src\components\RoomHeader.tsx

'use client';
import {useState} from 'react';
import type {Campaign} from '@/types/campaign';

export default function RoomHeader({campaign}: {campaign: Campaign}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <header className="roomHeader">
      <div>
        <h1 className='title2'>SALA: {adventure.title}</h1>
        <button
          className="button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▲ FECHAR INFO' : '▼ VER INFO'}
        </button>
      </div>

      {isExpanded && (
        <div className="headerDetails">
          <p><strong>Código da sala:</strong> {room.id}</p>
          <p><strong>Mundo:</strong> {world.title} {world.theme && `— ${world.theme}`}</p>
          <p><strong>Versão do mundo:</strong> {world.version}</p>
          <p><strong>Criada em:</strong> {room.createdAt.toLocaleDateString('pt-BR')}</p>
          {adventure.createdAt && (
            <p><strong>Aventura iniciada em:</strong> {adventure.createdAt.toLocaleDateString('pt-BR')}</p>
          )}
          {adventure.timeline && (
            <div>
              <strong>Linha do tempo:</strong>
              <p>{adventure.timeline}</p>
            </div>
          )}
        </div>
      )}
    </header>
  );
}