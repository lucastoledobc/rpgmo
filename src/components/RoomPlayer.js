'use client';
import {useRouter} from 'next/navigation';
import {useState, useEffect} from 'react';

export default function Room({roomId, chars}) {
  const router = useRouter();

  const handleEditChar = (charId) => {
    router.push(`/room/${roomId}/${charId}`);
  };

  return (
    <aside className="leftColumn">
        <h3>PERSONAGEM</h3>
        <div className="">
        {chars?.length === 0 ? (
            <p>Nenhum personagem.</p>
        ) : (
            chars.map((char) => (
            <div key={char.id} onClick={() => handleEditChar(char.id)} style={{cursor: 'pointer'}}>
                <p>👤 {char.nome}</p>
            </div>
            ))
        )}
        </div>
        
        {/* Botão para criar novo */}
        <button className="button" onClick={() => handleEditChar('new')}>+ CRIAR</button>
    </aside>
  );
}