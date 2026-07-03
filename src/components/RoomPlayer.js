'use client';
import {useRouter} from 'next/navigation';
import {useState, useEffect} from 'react';
import styles from '@/css/home.module.css';

export default function Room({personagens, roomId}) {
  const router = useRouter();

  const handleEditChar = (charId) => {
    router.push(`/room/${roomId}/${charId}`);
  };

  return (
    <aside className={styles.leftColumn}>
        <h3>PERSONAGEM</h3>
        <div className={styles.personagenstatus}>
        {personagens?.length === 0 ? (
            <p>Nenhum personagem.</p>
        ) : (
            personagens.map((char) => (
            <div key={char.id} onClick={() => handleEditChar(char.id)} style={{cursor: 'pointer'}}>
                <p>👤 {char.nome}</p>
            </div>
            ))
        )}
        </div>
        
        {/* Botão para criar novo */}
        <button 
        className={styles.button} 
        onClick={() => handleEditChar('new')}
        >
        + CRIAR
        </button>
    </aside>
  );
}