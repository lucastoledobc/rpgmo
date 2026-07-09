'use client';
import {useState, useEffect} from 'react';

export default function Room({roomInfo}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <header className="roomHeader">
      <h1 className='title2'>SALA: {roomInfo.name}</h1>
      <button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? '▲ FECHAR' : '▼ INFO'}
      </button>
      
      {/* Informações detalhadas */}
      {isExpanded && (
        <div className="headerDetails">
          <p><strong>ID da Sala:</strong> {roomInfo.id}</p>
          <p><strong>Criado em:</strong> {new Date(roomInfo.date).toLocaleString()}</p>
        </div>
      )}
    </header>
  );
}