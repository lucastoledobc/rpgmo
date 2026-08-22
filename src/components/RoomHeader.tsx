// arquivo: componente do header da sala
// local: src\components\Header.tsx

'use client';
import {useState} from 'react';
import type {Campaign} from '@/types/campaign';

export default function Header({campaign}: {campaign: Campaign}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <header className="roomHeader">
      <div>
        <h1 className='title2'>SALA: {campaign.title}</h1>
        <button
          className="button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▲ FECHAR INFO' : '▼ VER INFO'}
        </button>
      </div>

      {isExpanded && (
        <div className="headerDetails">
          <p><strong>Código da sala:</strong> {campaign.room}</p>
          <p><strong>Mundo:</strong> {campaign.world?.title ?? ''}</p>
          <p><strong>Versão do mundo:</strong> {campaign.world?.version}</p>
          <p><strong>Criada em:</strong> {campaign.createdAt?.toLocaleDateString('pt-BR')}</p>
        </div>
      )}
    </header>
  );
}