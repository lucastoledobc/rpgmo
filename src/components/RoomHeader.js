'use client';
import {useState, useEffect} from 'react';

export default function Room({roomInfo}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <header className="roomHeader">
      <div>
          <h1>SALA: {roomInfo.name}</h1>
          <button onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? '▲ FECHAR' : '▼ INFO'}
          </button>
      </div>
      
      {/* Informações detalhadas */}
      {isExpanded && (
        <div className="headerDetails">
          <p><strong>ID da Sala:</strong> {roomInfo.id}</p>
          <p><strong>Criado em:</strong> {new Date(roomInfo.create).toLocaleString()}</p>
        </div>
      )}
    </header>
  );
}